import * as ts from 'typescript';
// import { Expression } from '@angular/compiler';
// import { wrapFromEvent } from './rxjs_wrapper';

const rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
  'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];


// Checks if call expression is in rxjsCreationOperators array.
const isRxJSCreationOperator = (node: string): boolean => {
  return rxjsCreationOperators.includes(node) ? true : false;
};

// Checks if node is fromEvent call expression.
const isFromEventExpression = (node: ts.Node): boolean => {
  if (ts.isCallExpression(node)) {
    if (node.expression.getText() === 'fromEvent') {
      return true;
    }
  }

  return false;
};

// Replace given CallExpression with wrapperReplacementExcpression.
const createWrapperExpression = (expression: ts.CallExpression): ts.CallExpression => {
  const functionName = ts.createIdentifier('wrapFromEvent');
  const newExpression = ts.createCall(functionName, undefined, expression.arguments);
  return newExpression;
};

// Add import to given SourceFile.
// format: import importname as alias from file
const addNamedImportToSourceFile = (rootNode: ts.SourceFile, importName: string, alias: string, file: string): ts.SourceFile => {
  return ts.updateSourceFileNode(rootNode,
    [ts.createImportDeclaration(
        /*decorators*/undefined,
        /*modifiers*/ undefined,
      ts.createImportClause(
        undefined,
        ts.createNamedImports([ts.createImportSpecifier(ts.createIdentifier(`${importName}`), ts.createIdentifier(`${alias}`))])
      ),
      ts.createLiteral(`${file}`)
    ), ...rootNode.statements]);
};


// visitNode<T extends Node>(node: T | undefined, visitor: Visitor | undefined, test?: (node: Node) => boolean, lift?: (node: NodeArray<Node>) => T): T; 
const wrapVisitNode = <T extends ts.Node>(node: T | undefined, visitor: ts.Visitor | undefined, fromEvent: boolean, test?: (node: ts.Node) => boolean, lift?: (node: ts.NodeArray<ts.Node>) => T) => {
  console.log(`\n${fromEvent} ${fromEventExpressionFound} ${node.getSourceFile().fileName}`);
  if (test && lift) {
    return ts.visitNode(node, visitor, test, lift);
  } else if (test) {
    return ts.visitNode(node, visitor, test);
  } else {
    return ts.visitNode(node, visitor);
  }
};


// Loops over all nodes, when node matches teststring, replaces the string literal.
// TODO: the fromEventExpressionFound flag is set after the wrapVisitNode is executed.
export const dummyTransformer = <T extends ts.Node>(context: ts.TransformationContext) => {

  return (rootNode: ts.SourceFile) => {


    function visit(node: ts.Node): ts.Node {
      let fromEventExpressionFound = false;
      const realVisit = (node: ts.Node) => {
        if (isFromEventExpression(node)) {
          fromEventExpressionFound = true;
          console.log('isFromEventExpression', node.getSourceFile().fileName);
          // return createWrapperExpression(node as ts.CallExpression);
          return ts.visitEachChild(createWrapperExpression(node as ts.CallExpression), realVisit, context);
        } else {
          return ts.visitEachChild(node, realVisit, context);
        }

      }
      const root = realVisit(node);
      console.log(fromEventExpressionFound);
      return fromEventExpressionFound
        ? addNamedImportToSourceFile(root, 'wrapFromEvent', 'wrapFromEvent', 'rxjs_wrapper')
        : root;

    }


    // Wrap the rootNode with a wrapFromEvent import statement.

    return ts.visitNode(rootNode, visit);
    // return wrapVisitNode(rootNode, visit, fromEventExpressionFound);
  };
};
