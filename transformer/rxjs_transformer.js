"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var ts = require("typescript");
var node_dispatcher_1 = require("./node_dispatcher");
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
var addNamedImportToSourceFile = function (rootNode, importName, alias, file) {
    return ts.updateSourceFileNode(rootNode, __spreadArrays([ts.createImportDeclaration(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, ts.createImportClause(undefined, ts.createNamedImports([ts.createImportSpecifier(ts.createIdentifier("" + importName), ts.createIdentifier("" + alias))])), ts.createLiteral("" + file))], rootNode.statements));
};
// Add array of wrapper functions to given source file node.
var addWrapperFunctionImportArray = function (rootNode, operators) {
    var file = 'src/rxjs_wrapper';
    operators
        .filter(function (operator) { return operator !== null; })
        .map(function (operator) { return rootNode = addNamedImportToSourceFile(rootNode, operator, operator, file); });
    return rootNode;
};
// Loops over all nodes, when node matches teststring, replaces the string literal.
exports.dummyTransformer = function (context) {
    return function (rootNode) {
        if (rootNode.fileName.includes('/rxjs_wrapper.ts')) {
            console.log('\nIgnoring rxjs_wrapper.ts');
            return rootNode;
        }
        // let foundRxJSCreationOperator = false;
        var importStatements = new Set();
        function visit(node) {
            var realVisit = function (node) {
                var _a = node_dispatcher_1.dispatchNode(node), dispatchedNode = _a[0], wrapperImport = _a[1];
                wrapperImport && importStatements.add(wrapperImport);
                return ts.visitEachChild(dispatchedNode, realVisit, context);
            };
            // const realVisitDeprecated = (node: ts.Node) => {
            //   // if creation operator, wrap it.
            //   const [isCreationOperator, operator] = isRxJSCreationOperator(node);
            //   if (isCreationOperator) {
            //     foundRxJSCreationOperator = true;
            //     return createWrapCreationExpression(node as ts.CallExpression, operator);
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
            var root = realVisit(node);
            return addWrapperFunctionImportArray(root, Array.from(importStatements));
            // return foundRxJSCreationOperator
            //   ? addWrapperFunctionImportArray(root, ['wrapCreationOperator', 'wrapPipeableOperator', 'sendEventToBackpage'])
            //   : root;
        }
        return ts.visitNode(rootNode, visit);
    };
};
