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


// Replace given CallExpression with wrapFromEvent callExpression.
const createFromEventWrapperExpression = (expression: ts.CallExpression): ts.CallExpression => {
  const functionName = ts.createIdentifier('wrapFromEvent');
  const newExpression = ts.createCall(functionName, undefined, expression.arguments);
  return newExpression;
};

// Replace given callExpression with wrapper callExpression.
const createWrapperExpression = (expression: ts.CallExpression, operator: string): ts.CallExpression => {
  const wrapIdentifier = ts.createIdentifier('wrapCreationOperator');
  const metaData = ts.createLiteral('test');
  const innerIdentifier = ts.createIdentifier(operator);

  // TODO: can be cleaner.
  const first = ts.createCall(wrapIdentifier, undefined, [metaData, innerIdentifier]);
  const second = ts.createCall(first, undefined, expression.arguments);

  return second;
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

    function visit(node: ts.Node): ts.Node {
      let operatorsToImport: string[] = [];

      const realVisit = (node: ts.Node) => {

        const [found, operator] = isRxJSCreationOperator(node);


        // Add found operator to import array once.
        if (found && !operatorsToImport.includes(`wrap${operator.charAt(0).toUpperCase() + operator.substring(1)}`)) {
          operatorsToImport.push(`wrap${operator.charAt(0).toUpperCase() + operator.substring(1)}`);
        }

        // Mutate found operator to wrapper version.
        return found
          ? createWrapperExpression(node as ts.CallExpression, operator)
          : ts.visitEachChild(node, realVisit, context);
      }

      // TODO: wrapCreationOperator now imported in every file.
      const root = realVisit(node);
      return addNamedImportToSourceFile(root, 'wrapCreationOperator', 'wrapCreationOperator', 'rxjs_wrapper');
    }

    return ts.visitNode(rootNode, visit);
  };
};
