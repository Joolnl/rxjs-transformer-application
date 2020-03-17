import * as ts from 'typescript';
import { createPipeableOperatorMetadataExpression, createObservableMetadataExpression, registerObservableMetadata } from './metadata'

type WrappedCallExpressionFn = (a: string, b: string, c?: ts.Expression[]) => ts.CallExpression;

// Create wrapped RxJS creation operator expression.
export const createWrapCreationExpression = (expression: ts.CallExpression): ts.CallExpression => {
  const operator = expression.expression.getText();
  const metaDataExpression = createObservableMetadataExpression(expression, operator);
  const curriedCall = createWrappedCallExpression('wrapCreationOperator', operator, [metaDataExpression]);
  const completeCall = ts.createCall(curriedCall, undefined, expression.arguments);

  registerObservableMetadata(expression, operator);
  return completeCall;
};

// Returns an expression with given wrapperName wrapping given expression as argument.
const createWrappedCallExpression: WrappedCallExpressionFn = (wrapperName: string, innerName: string, args: ts.Expression[]) => {
  const wrapIdentifier = ts.createIdentifier(wrapperName);
  const innerIdentifier = ts.createIdentifier(innerName);
  const call = ts.createCall(wrapIdentifier, undefined, [innerIdentifier, ...args]);
  return call;
};

// Wrap array of pipeable operators.
const wrapPipeableOperatorArray = (args: ts.NodeArray<ts.CallExpression>): ts.NodeArray<ts.Expression> => {
  const createWrapper = (pipeOperator: ts.CallExpression, last: boolean) => {
    const metadata = createPipeableOperatorMetadataExpression(pipeOperator);
    return ts.createCall(ts.createIdentifier('wrapPipeableOperator'), undefined, [pipeOperator, ts.createLiteral(last), metadata]);
  };

  const isLast = (index: number) => args.length - 1 === index;

  const wrappedOperators = args.map((operator, index) => createWrapper(operator, isLast(index)));

  return ts.createNodeArray(wrappedOperators);
};

// Wrap all operators in given pipe and return expression.
export const wrapAllPipeableOperators = (node: ts.CallExpression): ts.CallExpression => {
  if (!node.arguments.every(arg => ts.isCallExpression(arg))) {
    throw new Error(`Trying to wrap non-CallExpression! ${node.getText()}`);
  }

  node.arguments = wrapPipeableOperatorArray(node.arguments as ts.NodeArray<ts.CallExpression>);

  return node;
};

// Wrapp subscribe method and return expression.
export const wrapSubscribeMethod = (node: ts.CallExpression): ts.CallExpression => {
  const args = node.arguments.map(arg => arg);  // ts.NodeArray => array.
  const propertyAccessExpr = node.expression as ts.PropertyAccessExpression;
  const source$ = propertyAccessExpr.expression;
  return ts.createCall(ts.createIdentifier('wrapSubscribe'), undefined, [source$, ...args]);
};