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

// Determine if callExpression is pipe operator.
const isPipeOperator = (node: ts.Node): boolean => {
  if (!ts.isCallExpression(node)) {
    return false;
  }

  const result = node.getChildren()
    .filter(node => ts.isPropertyAccessExpression(node))
    .filter((node: ts.PropertyAccessExpression) => node.name.getText() === 'pipe');
  
  // result.length && node.arguments.map(argument => console.log(argument.getText()));

  return result.length ? true : false;
}

// Replace given callExpression with wrapper callExpression.
const createWrapperExpression = (expression: ts.CallExpression, operator: string): ts.CallExpression => {
  const line = expression.getSourceFile().getLineAndCharacterOfPosition(expression.getStart()).line;
  const file = expression.getSourceFile().fileName;

  const fileProperty = ts.createPropertyAssignment('file', ts.createLiteral(file));
  const lineProperty = ts.createPropertyAssignment('line', ts.createNumericLiteral(line.toString()));
  const operatorProperty = ts.createPropertyAssignment('operator', ts.createLiteral(operator));
  const metaData = ts.createObjectLiteral([fileProperty, lineProperty, operatorProperty]);

  const wrapIdentifier = ts.createIdentifier('wrapCreationOperator');
  const innerIdentifier = ts.createIdentifier(operator);

  const curriedCall = ts.createCall(wrapIdentifier, undefined, [metaData, innerIdentifier]);
  const completeCall = ts.createCall(curriedCall, undefined, expression.arguments);

  return completeCall;
};

// Inject pip with a tap operation: tap(x => console.log(x))
const createInjectedPipeExpression = (node: ts.CallExpression): ts.CallExpression => {
  const parameter = ts.createParameter(
    undefined,
    undefined,
    undefined,
    ts.createIdentifier('x')
  );
  const consoleLog = ts.createPropertyAccess(ts.createIdentifier('console'), ts.createIdentifier('log'));
  const lambda = ts.createArrowFunction(
    undefined,
    undefined,
    [parameter],
    undefined,
    undefined,
    ts.createCall(consoleLog, undefined, [ts.createIdentifier('x')])
  );

  const tapExpression = ts.createCall(ts.createIdentifier('tap'), undefined, [lambda]);
  const newArguments = ts.createNodeArray([tapExpression, ...node.arguments])
  const newExpression = {...node, arguments: newArguments};
  return newExpression;
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

        // if creation operator, wrap it.
        const [isCreationOperator, operator] = isRxJSCreationOperator(node);
        if (isCreationOperator) {
          foundRxJSCreationOperator = true;
          return createWrapperExpression(node as ts.CallExpression, operator);
        }

        // if pipe operator, inject it.
        if (isPipeOperator(node)) {
          return createInjectedPipeExpression(node as ts.CallExpression);
        }

        return ts.visitEachChild(node, realVisit, context);
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
