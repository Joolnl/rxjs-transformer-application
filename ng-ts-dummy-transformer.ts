import * as ts from 'typescript';

const rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
  'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];


// Checks if call expression is in rxjsCreationOperators array.
const isRxJSCreationOperator = (node: ts.Node): [boolean, string | null] => {
  if (!ts.isCallExpression(node)) {
    return [false, null];
  }

  const operator = rxjsCreationOperators
    .filter(i => i === node.expression.getText())                                 // Filter rxjs creation operator
    .pop();                                                                       // Return as string.

  return operator !== undefined
    ? [true, operator]
    : [false, null];
};

// Replace given callExpression with wrapper callExpression.
const createWrapperExpression = (expression: ts.CallExpression, operator: string): ts.CallExpression => {
  const wrapIdentifier = ts.createIdentifier('wrapCreationOperator');
  const fileProperty = ts.createPropertyAssignment('file', ts.createLiteral('app_component.ts'));
  const lineProperty = ts.createPropertyAssignment('line', ts.createNumericLiteral('1'));
  const metaData = ts.createObjectLiteral([fileProperty, lineProperty]);
  const innerIdentifier = ts.createIdentifier(operator);

  const curriedCall = ts.createCall(wrapIdentifier, undefined, [metaData, innerIdentifier]);
  const completeCall = ts.createCall(curriedCall, undefined, expression.arguments);

  return completeCall;
};

// Add import to given SourceFile.
// format: import importname as alias from file
const addNamedImportToSourceFile = (rootNode: ts.SourceFile, importName: string, alias: string, file: string): ts.SourceFile => {
  return ts.updateSourceFileNode(rootNode,
    [ts.createImportDeclaration(
        /*decorators*/undefined,
        /*modifiers*/ undefined,
      ts.createImportClause(
        undefined,
        ts.createNamedImports([ts.createImportSpecifier(ts.createIdentifier(`${importName}`), ts.createIdentifier(`${alias}`))])
      ),
      ts.createLiteral(`${file}`)
    ), ...rootNode.statements]);
};

// Add array of wrapper functions to given source file node.
const addWrapperFunctionImportArray = (rootNode: ts.SourceFile, operators: string[]): ts.SourceFile => {
  const file = 'rxjs_wrapper';
  operators
    .map(operator => rootNode = addNamedImportToSourceFile(rootNode, operator, operator, file));
  return rootNode;
};


// Loops over all nodes, when node matches teststring, replaces the string literal.
export const dummyTransformer = <T extends ts.Node>(context: ts.TransformationContext) => {

  return (rootNode: ts.SourceFile) => {
    let foundRxJSCreationOperator = false;

    function visit(node: ts.Node): ts.Node {
      const realVisit = (node: ts.Node) => {
        const [found, operator] = isRxJSCreationOperator(node);
        found && (foundRxJSCreationOperator = true);

        // Mutate found operator to wrapper version.
        return found
          ? createWrapperExpression(node as ts.CallExpression, operator)
          : ts.visitEachChild(node, realVisit, context);
      }

      // Add required imports to sourceFile after visitor pattern.
      const root = realVisit(node);
      return foundRxJSCreationOperator
        ? addNamedImportToSourceFile(root, 'wrapCreationOperator', 'wrapCreationOperator', 'rxjs_wrapper')
        : root;
    }

    return ts.visitNode(rootNode, visit);
  };
};
