import * as ts from 'typescript';
import { createObservableMetadataExpression, createPipeableOperatorMetadataExpression } from './metadata'

type WrappedCallExpressionFn = (a: string, b: string, c?: ts.Expression[]) => ts.CallExpression;

// Returns an expression with given wrapperName wrapping given expression as argument.
export const createWrappedCallExpression: WrappedCallExpressionFn = (wrapperName, innerName, args) => {
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

  const isLast = (index: number) => {
    return args.length - 1 === index;
  };

  const result = args.map((operator, index) => createWrapper(operator, isLast(index)));

  return ts.createNodeArray(result);
};

// Wrap all operators in given pipe and return expression.
export const wrapAllPipeableOperators = (node: ts.CallExpression): ts.CallExpression => {
  if (!node.arguments.every(arg => ts.isCallExpression(arg))) {
    throw new Error(`Trying to wrap non-CallExpression! ${node.getText()}`);
  }

  node.arguments = wrapPipeableOperatorArray(node.arguments as ts.NodeArray<ts.CallExpression>);

  return node;
};