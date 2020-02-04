import * as ts from 'typescript';
import { wrapFromEvent } from './rxjs_wrapper';

const rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
  'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];


const isTestString = (node: string) => {
  return node === `'TESTSTRING'`;
};

const createStringLiteral = () => {
  // console.log('\ncreating new literal\n');
  return ts.createStringLiteral('!@#$%#$%');
};

// For testing, examine passed in node.
const examineNode = (node: ts.Node) => {
  console.log(`stringLiteral: ${node.getText()} ${ts.isStringLiteral(node)}`);
};

const isRxJSCreationOperator = (node: string): boolean => {
  return rxjsCreationOperators.includes(node) ? true : false;
};

const isFromEventExpression = (node: ts.Node): boolean => {
  if (ts.isCallExpression(node)) {
    if (node.expression.getText() === 'fromEvent') {
      return true;
    }
  }

  return false;
}

// Replace given CallExpression with wrapperReplacementExcpression.
const createWrapperExpression = (expression: ts.CallExpression): ts.CallExpression => {
  const functionName = ts.createIdentifier('wrapFromEvent');
  const newExpression = ts.createCall(functionName, undefined, expression.arguments);
  return newExpression;
};

// Loops over all nodes, when node matches teststring, replaces the string literal.
export const dummyTransformer = <T extends ts.Node>(context: ts.TransformationContext) => {
  return (rootNode: ts.SourceFile) => {

    function visit(node: ts.Node): ts.Node {

      if (ts.isCallExpression(node)) {
        const expression: ts.CallExpression = node;
        const isRxJsOperator = isRxJSCreationOperator(expression.expression.getText());
        // console.log(ts.SyntaxKind.CallExpression === node.kind);
        // console.log(`${expression.expression.getText()} : ${isRxJsOperator}`);
        // if (isRxJsOperator && expression.expression.getText() === 'fromEvent')
      }

      return isTestString(node.getText())
        // ? ts.visitEachChild(createStringLiteral(), visit, context)
        ? createStringLiteral()
        : ts.visitEachChild(node, visit, context);
      // return ts.visitEachChild(node, visit, context);
    }
    return ts.visitNode(rootNode, visit);
  };
};
