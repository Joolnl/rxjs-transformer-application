import * as ts from 'typescript';
// import { createWrappedCallExpression, wrapAllPipeableOperators } from './operator_wrapper';
// import { registerObservableMetadata, createObservableMetadataExpression } from './metadata';
import { dispatchNode } from './node_dispatcher';

// const rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
//   'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];

// // Checks if call expression is in rxjsCreationOperators array.
// const isRxJSCreationOperator = (node: ts.Node): [boolean, string | null] => {
//   if (!ts.isCallExpression(node)) {
//     return [false, null];
//   }

//   const operator = rxjsCreationOperators
//     .filter(i => i === node.expression.getText())                                 // Filter rxjs creation operator
//     .pop();                                                                       // Return as string.

//   return operator !== undefined
//     ? [true, operator]
//     : [false, null];
// };

// // Determine if callExpression is pipe operator.
// const isPipeOperator = (node: ts.Node): boolean => {
//   if (!ts.isCallExpression(node)) {
//     return false;
//   }

//   const result = node.getChildren()
//     .filter(child => ts.isPropertyAccessExpression(child))
//     // .filter((child: ts.PropertyAccessExpression) => child.name.getText() === 'pipe');
//     .filter((child: ts.PropertyAccessExpression) => ['pipe', 'merge'].includes(child.name.getText()))

//   return result.length ? true : false;
// };

// // Replace given callExpression with wrapper callExpression.
// const createWrapCreationExpression = (expression: ts.CallExpression, operator: string): ts.CallExpression => {
//   const metaDataExpression = createObservableMetadataExpression(expression, operator);
//   const curriedCall = createWrappedCallExpression('wrapCreationOperator', operator, [metaDataExpression]);
//   const completeCall = ts.createCall(curriedCall, undefined, expression.arguments);

//   registerObservableMetadata(expression, operator);
//   return completeCall;
// };

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

// Add array of wrapper functions to given source file node.
const addWrapperFunctionImportArray = (rootNode: ts.SourceFile, operators: string[]): ts.SourceFile => {
  const file = 'src/rxjs_wrapper';
  operators
    .filter(operator => operator !== null)
    .map(operator => rootNode = addNamedImportToSourceFile(rootNode, operator, operator, file))
  return rootNode;
};


// Loops over all nodes, when node matches teststring, replaces the string literal.
export const dummyTransformer = <T extends ts.Node>(context: ts.TransformationContext) => {

  return (rootNode: ts.SourceFile) => {
    if (rootNode.fileName.includes('/rxjs_wrapper.ts')) {
      console.log('\nIgnoring rxjs_wrapper.ts');
      return rootNode;
    }

    // let foundRxJSCreationOperator = false;
    let importStatements: Set<string> = new Set();

    function visit(node: ts.SourceFile): ts.SourceFile {

      const realVisit = (node: ts.Node): ts.Node => {
        const [dispatchedNode, wrapperImport] = dispatchNode(node);
        wrapperImport && importStatements.add(wrapperImport);

        return ts.visitEachChild(dispatchedNode, realVisit, context);
      };


      // const realVisitDeprecated = (node: ts.Node) => {

      //   // if creation operator, wrap it.
      //   const [isCreationOperator, operator] = isRxJSCreationOperator(node);
      //   if (isCreationOperator) {
      //     foundRxJSCreationOperator = true;
      // return createWrapCreationExpression(node as ts.CallExpression, operator);
      //   }

      //   // if pipe operator, inject it.
      //   if (isPipeOperator(node)) {
      //     try {
      //       node = wrapAllPipeableOperators(node as ts.CallExpression);
      //     } catch (e) {
      //       console.log(e);
      //     }

      //     return node;
      //     // return createInjectedPipeExpression(node as ts.CallExpression);
      //     // return ts.visitEachChild(createInjectedPipeExpression(node as ts.CallExpression), realVisit, context);
      //   }

      //   return ts.visitEachChild(node, realVisit, context);
      // };

      // TODO: optimize imports
      // Add required imports to sourceFile after visitor pattern.
      const root = realVisit(node) as ts.SourceFile;
      return addWrapperFunctionImportArray(root, ['wrapCreationOperator', 'wrapPipeableOperator', 'sendEventToBackpage', ...Array.from(importStatements)]);
      // return foundRxJSCreationOperator
      //   ? addWrapperFunctionImportArray(root, ['wrapCreationOperator', 'wrapPipeableOperator', 'sendEventToBackpage'])
      //   : root;
    }

    return ts.visitNode(rootNode, visit);
  };
};
