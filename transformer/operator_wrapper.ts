import * as ts from 'typescript';
import * as uuid from 'uuid/v4';
import {
  createPipeableOperatorMetadataExpression, createObservableMetadataExpression,
  createSubscriberMetadataExpression, registerPipe, createPipeMetadataExpression
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
export const createWrapCreationExpression = (node: ts.CallExpression): ts.CallExpression => {
  const identifier: ts.Identifier = node.expression as ts.Identifier;
  const variableName = ts.isVariableDeclaration(node.parent)
    ? node.parent.name.getText()
    : 'anonymous';
  const metaDataExpression = createObservableMetadataExpression(identifier, variableName);
  const curriedCall = createWrappedCallExpression('wrapCreationOperator', identifier.getText(), [metaDataExpression]);
  const completeCall = ts.createCall(curriedCall, undefined, node.arguments);
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

// Wrap pipe and all its operators.
export const wrapPipeStatement = (node: ts.CallExpression): ts.CallExpression => {
  const propertyAccessExpr: ts.PropertyAccessExpression = node.expression as ts.PropertyAccessExpression;
  const source$: ts.Identifier = propertyAccessExpr.expression as ts.Identifier;
  const identifier: ts.Identifier = propertyAccessExpr.name as ts.Identifier;

  const variableName = ts.isVariableDeclaration(node.parent)  // TODO: duplicate code extract to function.
    ? node.parent.name.getText()
    : 'anonymous';
  const [metadataExpression, pipeUUID] = createPipeMetadataExpression(node, identifier, variableName);
  const args = wrapPipeableOperatorArray(node.arguments, pipeUUID).map(arg => arg);
  return ts.createCall(ts.createIdentifier('wrapPipe'), undefined, [source$, metadataExpression, ...args]);
};
// export const wrapPipeStatement = (node: ts.CallExpression, anonymous: boolean): ts.CallExpression => {
//   const pipeUUID = uuid();
//   let identifier: string;
//   if (!anonymous) {
//     identifier = getPipeIdentifier(node);
//     registerPipe(pipeUUID, identifier, node);
//   }
//   const metadata = createPipeMetadataExpression(node, identifier, pipeUUID);
//   const propertyAccessExpr = node.expression as ts.PropertyAccessExpression;
//   const source$ = propertyAccessExpr.expression;
//   node.arguments = wrapPipeableOperatorArray(node.arguments, pipeUUID);
// const args = node.arguments.map(arg => arg); // ts.NodeArray => array.
//   return ts.createCall(ts.createIdentifier('wrapPipe'), undefined, [source$, metadata, ...args]);
// };

const getPipeIdentifier = (node: ts.CallExpression): string => {
  if (ts.isCallExpression(node) && ts.isVariableDeclaration(node.parent)) {
    return node.parent.name.getText();
  }
  throw new Error('Can not find pipe identifier!');
};

// Wrapp subscribe method and return expression.
export const wrapSubscribeMethod = (node: ts.CallExpression): ts.CallExpression => {
  const args = node.arguments.map(arg => arg);  // ts.NodeArray => array.
  const propertyAccessExpr = node.expression as ts.PropertyAccessExpression;
  const source$ = propertyAccessExpr.expression;
  createSubscriberMetadataExpression(node);

  return ts.createCall(ts.createIdentifier('wrapSubscribe'), undefined, [source$, ...args]);
};
