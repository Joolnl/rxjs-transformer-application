import * as ts from 'typescript';
import { Metadata, extractMetaData } from './metadata';

type WrappedCallExpressionFn = (a: string, b: string, c?: ts.Expression[]) => ts.CallExpression;
type CurriedCallExpressionFn = (a: Metadata, b: string, c: string, d?: ts.Expression[]) => ts.CallExpression;

// Returns an expression with given wrapperName wrapping given expression as argument.
export const createWrappedCallExpression: WrappedCallExpressionFn = (wrapperName, innerName, args) => {
  const wrapIdentifier = ts.createIdentifier(wrapperName);
  const innerIdentifier = ts.createIdentifier(innerName);
  const call = ts.createCall(wrapIdentifier, undefined, [innerIdentifier, ...args]);
  return call;
};

// const createCurriedWrapCallExpression: CurriedCallExpressionFn = (metadata, wrapperName, innerName, args) {

// };

// TODO: turn all operator arguments into wrappedCallExpressions
// TODO: determine where to place logic to choose appropriate wrapper, like single, frist, last...
// TODO: probably also require for seperate functions for building the arguments array
// TODO: but a single function to create the curried wrapper call.
const argArrayToWrappedArgArray = (args: ts.NodeArray<ts.CallExpression>, metaData: Metadata): ts.NodeArray<ts.Expression> => {
  // map(x => x += 1)
  const wrapIdentifier = ts.createIdentifier('singleWrapOperatorFunction');
  const result = args.map(arg => {
    return ts.createCall(wrapIdentifier, undefined, [arg]);
  });

  return ts.createNodeArray(result);
};

// Wrap all operators in given pipe and return expression.
export const wrapPipeOperators = (node: ts.CallExpression): ts.CallExpression => {
  if (! node.arguments.every(arg => ts.isCallExpression(arg))) {
    throw new Error(`Trying to wrap non-CallExpression! ${node.getText()}`);
  }

  const metaData = extractMetaData(node);

  if (node.arguments.length === 1) {
    node.arguments = argArrayToWrappedArgArray(node.arguments as ts.NodeArray<ts.CallExpression>, metaData);
  }

  return node;
};