import * as ts from 'typescript';

type WrappedCallExpressionFn = (a: string, b: string, c?: ts.Expression[]) => ts.CallExpression;

// Returns an expression with given wrapperName wrapping given expression as argument.
export const createWrappedCallExpression: WrappedCallExpressionFn = (wrapperName, innerName, args) => {
  const wrapIdentifier = ts.createIdentifier(wrapperName);
  const innerIdentifier = ts.createIdentifier(innerName);
  const call = ts.createCall(wrapIdentifier, undefined, [innerIdentifier, ...args]);
  return call;
};

// Wrap array of pipeable operators.
const wrapOperatorArray = (args: ts.NodeArray<ts.CallExpression>): ts.NodeArray<ts.Expression> => {
  const createWrapper = (pipeOperator: ts.CallExpression, last: boolean) => {
    return ts.createCall(ts.createIdentifier('singleWrapOperatorFunction'), undefined, [pipeOperator, ts.createLiteral(last)]);
  };

  const isLast = (index: number) => {
    console.log(`isLast: ${args.length - 1 === index}`);
    return args.length - 1 === index;
  };

  const result = args.map((operator, index) => createWrapper(operator, isLast(index)));

  return ts.createNodeArray(result);
};

// Wrap all operators in given pipe and return expression.
export const wrapPipeOperators = (node: ts.CallExpression): ts.CallExpression => {
  if (!node.arguments.every(arg => ts.isCallExpression(arg))) {
    throw new Error(`Trying to wrap non-CallExpression! ${node.getText()}`);
  }

  node.arguments = wrapOperatorArray(node.arguments as ts.NodeArray<ts.CallExpression>);

  return node;
};