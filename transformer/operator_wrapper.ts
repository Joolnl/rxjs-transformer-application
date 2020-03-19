import * as ts from 'typescript';
import * as uuid from 'uuid/v4';
import {
  createPipeableOperatorMetadataExpression, createObservableMetadataExpression,
  registerObservableMetadata, createSubscriberMetadataExpression, registerPipe
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
const wrapPipeableOperatorArray = (args: ts.NodeArray<ts.Expression>, pipeIdentifier: string): ts.NodeArray<ts.Expression> => {
  if (!args.every(operator => ts.isCallExpression(operator))) {
    throw new Error('Can not wrap pipe operators, invalid NodeArray!');
  }

  const createWrapper = (pipeOperator: ts.CallExpression, last: boolean) => {
    const metadata = createPipeableOperatorMetadataExpression(pipeOperator, pipeIdentifier);
    return ts.createCall(ts.createIdentifier('wrapPipeableOperator'), undefined, [pipeOperator, ts.createLiteral(last), metadata]);
  };

  const isLast = (index: number) => args.length - 1 === index;

  const wrappedOperators = args.map((operator, index) => createWrapper(operator as ts.CallExpression, isLast(index)));

  return ts.createNodeArray(wrappedOperators);
};

// TODO: clean up function.
const wrapPipeOperators2 = (node: ts.PropertyAccessExpression, pipeUUID: string): Array<ts.CallExpression> => {
  if (!ts.isCallExpression(node.parent)) {
    throw new Error('Can not wrap pipe operators, can not acces arguments!');
  }
  const args = node.parent.arguments;

  if (!args.every(operator => ts.isCallExpression(operator))) {
    throw new Error('Can not wrap pipe operators, invalid NodeArray!');
  }

  const createWrapper = (pipeOperator: ts.CallExpression, last: boolean) => {
    const metadata = createPipeableOperatorMetadataExpression(pipeOperator, pipeUUID);
    return ts.createCall(ts.createIdentifier('wrapPipeableOperator'), undefined, [pipeOperator, ts.createLiteral(last), metadata]);
  };

  const isLast = (index: number) => args.length - 1 === index;

  return args.map((operator, index) => createWrapper(operator as ts.CallExpression, isLast(index)));
};

const wrapPipeOperators = (node: ts.PropertyAccessExpression, pipeIdentifier?: string): ts.PropertyAccessExpression => {
  if (ts.isCallExpression(node.parent)) {
    node.parent.arguments = wrapPipeableOperatorArray(node.parent.arguments, pipeIdentifier);
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
export const wrapPipeStatement = (node: ts.CallExpression): ts.CallExpression => {
  // const pipeUUID = uuid();
  // const identifier = getPipeIdentifier(node);
  // registerPipe(pipeUUID, identifier, node);
  // node = wrapPipeOperators(node, identifier);
  // console.log(`${identifier} pipe wrapped`);
  return node;
  // const wrappedOperators = wrapPipeOperators2(node, pipeUUID);
  // const source$ = node.expression;
  // return ts.createCall(ts.createIdentifier('wrapPipe'), undefined, [source$]);
};

// TODO: can't replace property acces expression with call expression.
export const wrapAnonymousPipeStatement = (node: ts.CallExpression): ts.CallExpression => {
  const propertyAccessExpr = node.expression as ts.PropertyAccessExpression;
  const source$ = propertyAccessExpr.expression;
  node.arguments = wrapPipeableOperatorArray(node.arguments, uuid());
  const args = node.arguments.map(arg => arg); // ts.NodeArray => array.
  return ts.createCall(ts.createIdentifier('wrapPipe'), undefined, [source$, ...args]);
  // return node;
};

// Wrapp subscribe method and return expression.
export const wrapSubscribeMethod = (node: ts.CallExpression): ts.CallExpression => {
  const args = node.arguments.map(arg => arg);  // ts.NodeArray => array.
  const propertyAccessExpr = node.expression as ts.PropertyAccessExpression;
  const source$ = propertyAccessExpr.expression;
  createSubscriberMetadataExpression(node);

  return ts.createCall(ts.createIdentifier('wrapSubscribe'), undefined, [source$, ...args]);
};
