import * as ts from 'typescript';
import { Metadata, extractMetaData, createMetaDataExpression } from './metadata';
import { createTestSourceFile } from './expressionFactory';

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

const createTestTapExpression = () => {
  const parameter = ts.createParameter(undefined, undefined, undefined, ts.createIdentifier('x'));
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

  return lambda;
};

// TODO: turn all operator arguments into wrappedCallExpressions
// TODO: determine where to place logic to choose appropriate wrapper, like single, frist, last...
// TODO: probably also require for seperate functions for building the arguments array
// TODO: but a single function to create the curried wrapper call.
const argArrayToWrappedArgArray = (args: ts.NodeArray<ts.CallExpression>): ts.NodeArray<ts.Expression> => {
  const result = args.map(arg => {
    const operator = arg.expression.getText();
    const curried = createWrappedCallExpression('singleWrapOperatorFunction', operator, [createMetaDataExpression(arg, operator)]);
    const complete = ts.createCall(curried, undefined, arg.arguments);
    arg.arguments.map(arg => console.log(`arg arguments ${arg.getText()} ${ts.SyntaxKind[arg.kind]}`));
    return complete;
  });

  return ts.createNodeArray(result);
};

// Wrap all operators in given pipe and return expression.
export const wrapPipeOperators = (node: ts.CallExpression): ts.CallExpression => {
  if (! node.arguments.every(arg => ts.isCallExpression(arg))) {
    throw new Error(`Trying to wrap non-CallExpression! ${node.getText()}`);
  }

  console.log(`Coming here in wrapPipeOperators with arguments:  ${node.arguments.length}`);

  if (node.arguments.length === 1) {
    node.arguments = argArrayToWrappedArgArray(node.arguments as ts.NodeArray<ts.CallExpression>);
    
  }

  return node;
};