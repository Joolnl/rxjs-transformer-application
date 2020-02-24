import * as ts from 'typescript';
import { createWrappedCallExpression, wrapPipeOperators } from './operator_wrapper';
import { getObservableMetadata, registerObservableMetadata, extractMetaData } from './metadata';

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
    .filter(child => ts.isPropertyAccessExpression(child))
    .filter((child: ts.PropertyAccessExpression) => child.name.getText() === 'pipe');

  return result.length ? true : false;
};

// Create metadata object literal expression from expression and operator.
const createMetaDataExpression = (expression: ts.CallExpression, operator: string): ts.ObjectLiteralExpression => {
  const { line, file, uuid } = extractMetaData(expression);
  const uuidProperty = ts.createPropertyAssignment('uuid', ts.createLiteral(uuid));
  const fileProperty = ts.createPropertyAssignment('file', ts.createLiteral(file));
  const lineProperty = ts.createPropertyAssignment('line', ts.createNumericLiteral(line.toString()));
  const operatorProperty = ts.createPropertyAssignment('operator', ts.createLiteral(operator));
  const metaData = ts.createObjectLiteral([uuidProperty, fileProperty, lineProperty, operatorProperty]);

  return metaData;
};

// Replace given callExpression with wrapper callExpression.
const createWrapperExpression = (expression: ts.CallExpression, operator: string): ts.CallExpression => {
  const metaDataExpression = createMetaDataExpression(expression, operator);
  const curriedCall = createWrappedCallExpression('wrapCreationOperator', operator, [metaDataExpression]);
  const completeCall = ts.createCall(curriedCall, undefined, expression.arguments);

  registerObservableMetadata(expression, operator);
  return completeCall;
};

// Creates: tap(x => sendEventToBackpage(metadata, x, subUuid, random))
const createTapsendEventToBackpageExpression = (metadata, event: ts.ParameterDeclaration, subUuid: string) => (operator: string): ts.Expression => {
    const sendEvent = ts.createIdentifier('sendEventToBackpage');
    const lambda = ts.createArrowFunction(
      undefined,
      undefined,
      [event],
      undefined,
      undefined,
      ts.createCall(sendEvent, undefined, [metadata, ts.createLiteral(operator), ts.createIdentifier('x'), ts.createLiteral(subUuid)])
    );

    const tapExpression = ts.createCall(ts.createIdentifier('tap'), undefined, [lambda]);

    return tapExpression;
  };

// Inject new argument for every given argument.
const injectArguments = (args: ts.NodeArray<ts.Expression>, tapExpr: (operator: string) => ts.Expression): ts.NodeArray<ts.Expression> => {
  const newArgs: ts.Expression[] = [];
  newArgs.push(tapExpr('initial'));
  args.forEach((el) => {
    newArgs.push(el);
    newArgs.push(tapExpr(el.getText()));
  });

  return ts.createNodeArray(newArgs);
};

// Inject pipe with a tap operation: tap(x => console.log(x))
const createInjectedPipeExpression = (node: ts.CallExpression): ts.CallExpression => {
  const observableMetadata = getObservableMetadata(node);
  const subUuid = observableMetadata ? observableMetadata.uuid : '0';
  const parameter = ts.createParameter(
    undefined,
    undefined,
    undefined,
    ts.createIdentifier('x')
  );
  const operator = node.getText();
  const metadata = createMetaDataExpression(node, operator);
  const tapExpressionCreator = createTapsendEventToBackpageExpression(metadata, parameter, subUuid);

  const newArguments = injectArguments(node.arguments, tapExpressionCreator);
  const newExpression = { ...node, arguments: newArguments };

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
  const file = 'src/rxjs_wrapper';
  operators
    .map(operator => rootNode = addNamedImportToSourceFile(rootNode, operator, operator, file));
  return rootNode;
};


// Loops over all nodes, when node matches teststring, replaces the string literal.
export const dummyTransformer = <T extends ts.Node>(context: ts.TransformationContext) => {

  return (rootNode: ts.SourceFile) => {
    if (rootNode.fileName.includes('/rxjs_wrapper.ts')) {
      console.log('\nIgnoring rxjs_wrapper.ts');
      return rootNode;
    }

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
          try {
            node = wrapPipeOperators(node as ts.CallExpression);
          } catch (e) {
            console.log(e);
          }
          
          return node;
          // return createInjectedPipeExpression(node as ts.CallExpression);
          // return ts.visitEachChild(createInjectedPipeExpression(node as ts.CallExpression), realVisit, context);
        }

        return ts.visitEachChild(node, realVisit, context);
      };

      // Add required imports to sourceFile after visitor pattern.
      const root = realVisit(node);
      return foundRxJSCreationOperator
        ? addWrapperFunctionImportArray(root, ['wrapCreationOperator', 'singleWrapOperatorFunction', 'sendEventToBackpage'])
        : root;
    }

    return ts.visitNode(rootNode, visit);
  };
};
