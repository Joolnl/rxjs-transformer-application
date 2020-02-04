import * as ts from 'typescript';
// import { Expression } from '@angular/compiler';
// import { wrapFromEvent } from './rxjs_wrapper';

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

const createTestWrapperExpression = (expression: ts.CallExpression): ts.CallExpression => {
  const functionName = ts.createIdentifier('testWrapper');
  const newExpression = ts.createCall(functionName, undefined, undefined);
  return newExpression;
};

// Loops over all nodes, when node matches teststring, replaces the string literal.
export const dummyTransformer = <T extends ts.Node>(context: ts.TransformationContext) => {

  return (rootNode: ts.SourceFile) => {

    const file = rootNode as ts.SourceFile;
    console.log(file.fileName);
    const update = ts.updateSourceFileNode(file,
      [ts.createImportDeclaration(
          /*decorators*/undefined,
          /*modifiers*/ undefined,
        ts.createImportClause(
          undefined,
          ts.createNamedImports([ts.createImportSpecifier(ts.createIdentifier('wrapFromEvent'), ts.createIdentifier('wrapFromEvent'))])
        ),
        ts.createLiteral('rxjs_wrapper')
      ), ...file.statements]);
    ts.visitEachChild(rootNode, visit, context);
    rootNode = update;

    function visit(node: ts.Node): ts.Node {

      return isFromEventExpression(node)
        ? createWrapperExpression(<ts.CallExpression>node)
        : ts.visitEachChild(node, visit, context);
    }



    return ts.visitNode(rootNode, visit);
  };
};
