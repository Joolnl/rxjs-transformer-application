import * as ts from 'typescript';
import {
  createPipeableOperatorMetadataExpression, createObservableMetadataExpression,
  registerObservableMetadata, createSubscriberMetadataExpression, registerPipeIfNotAnonymous
} from './metadata';

type WrappedCallExpressionFn = (a: string, b: string, c?: ts.Expression[]) => ts.CallExpression;

// Returns an expression with given wrapperName wrapping given expression as argument.
const createWrappedCallExpression: WrappedCallExpressionFn = (wrapperName: string, innerName: string, args: ts.Expression[]) => {
  const wrapIdentifier = ts.createIdentifier(wrapperName);
  const innerIdentifier = ts.createIdentifier(innerName);
  const call = ts.createCall(wrapIdentifier, undefined, [innerIdentifier, ...args]);
  return call;
};

// Create wrapped RxJS creation operator expression.
export const createWrapCreationExpression = (expression: ts.CallExpression): ts.CallExpression => {
  const operator = expression.expression.getText();
  const metaDataExpression = createObservableMetadataExpression(expression, operator);
  const curriedCall = createWrappedCallExpression('wrapCreationOperator', operator, [metaDataExpression]);
  const completeCall = ts.createCall(curriedCall, undefined, expression.arguments);

  registerObservableMetadata(expression, operator);
  return completeCall;
};

// Wrap array of pipeable operators.
const wrapPipeableOperatorArray = (args: ts.NodeArray<ts.Expression>): ts.NodeArray<ts.Expression> => {
  if (!args.every(operator => ts.isCallExpression(operator))) {
    throw new Error('Can not wrap pipe operators, invalid NodeArray!');
  }

  const createWrapper = (pipeOperator: ts.CallExpression, last: boolean) => {
    const metadata = createPipeableOperatorMetadataExpression(pipeOperator);
    return ts.createCall(ts.createIdentifier('wrapPipeableOperator'), undefined, [pipeOperator, ts.createLiteral(last), metadata]);
  };

  const isLast = (index: number) => args.length - 1 === index;

  const wrappedOperators = args.map((operator, index) => createWrapper(operator as ts.CallExpression, isLast(index)));

  return ts.createNodeArray(wrappedOperators);
};

const wrapPipeOperators = (node: ts.PropertyAccessExpression): ts.PropertyAccessExpression => {
  if (ts.isCallExpression(node.parent)) {
    node.parent.arguments = wrapPipeableOperatorArray(node.parent.arguments);
    return node;
  } else {
    throw new Error('Can not wrap pipe!');
  }
};

const getPipeIdentifier = (node: ts.PropertyAccessExpression): string => {
  if (ts.isCallExpression(node.parent) && ts.isVariableDeclaration(node.parent.parent)) {
    return node.parent.parent.name.getText();
  }
  throw new Error('Can not find pipe identifier!');
};

// Wrap pipe and all it's operators.
export const wrapPipeStatement = (node: ts.PropertyAccessExpression): ts.PropertyAccessExpression => {
  node = wrapPipeOperators(node);
  const identifier = getPipeIdentifier(node);
  console.log(`${identifier} pipe wrapped`);
  return node;
};

export const wrapAnonymousPipeStatement = (node: ts.PropertyAccessExpression): ts.PropertyAccessExpression => {
  node = wrapPipeOperators(node);
  return node;
};

// Wrapp subscribe method and return expression.
export const wrapSubscribeMethod = (node: ts.CallExpression): ts.CallExpression => {
  const args = node.arguments.map(arg => arg);  // ts.NodeArray => array.
  const propertyAccessExpr = node.expression as ts.PropertyAccessExpression;
  const source$ = propertyAccessExpr.expression;
  createSubscriberMetadataExpression(node);

  return ts.createCall(ts.createIdentifier('wrapSubscribe'), undefined, [source$, ...args]);
};
