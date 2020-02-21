import * as ts from 'typescript';

type WrappedCallExpressionFn = (a: string, b: string, c?: ts.Expression[]) => ts.CallExpression;

// Returns an expression with given wrapperName wrapping given expression as argument.
export const createWrappedCallExpression: WrappedCallExpressionFn = (wrapperName, innerName, args) => {
    const wrapIdentifier = ts.createIdentifier(wrapperName);
    const innerIdentifier = ts.createIdentifier(innerName);
    const call = ts.createCall(wrapIdentifier, undefined, [innerIdentifier, ...args]);
    return call;
  };

  