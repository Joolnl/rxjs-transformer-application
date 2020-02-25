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
var operator_wrapper_1 = require("./operator_wrapper");
var metadata_1 = require("./metadata");
var rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
    'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];
// Checks if call expression is in rxjsCreationOperators array.
var isRxJSCreationOperator = function (node) {
    if (!ts.isCallExpression(node)) {
        return [false, null];
    }
    var operator = rxjsCreationOperators
        .filter(function (i) { return i === node.expression.getText(); }) // Filter rxjs creation operator
        .pop(); // Return as string.
    return operator !== undefined
        ? [true, operator]
        : [false, null];
};
// Determine if callExpression is pipe operator.
var isPipeOperator = function (node) {
    if (!ts.isCallExpression(node)) {
        return false;
    }
    var result = node.getChildren()
        .filter(function (child) { return ts.isPropertyAccessExpression(child); })
        .filter(function (child) { return child.name.getText() === 'pipe'; });
    return result.length ? true : false;
};
// Replace given callExpression with wrapper callExpression.
var createWrapperExpression = function (expression, operator) {
    var metaDataExpression = metadata_1.createMetaDataExpression(expression, operator);
    var curriedCall = operator_wrapper_1.createWrappedCallExpression('wrapCreationOperator', operator, [metaDataExpression]);
    var completeCall = ts.createCall(curriedCall, undefined, expression.arguments);
    metadata_1.registerObservableMetadata(expression, operator);
    return completeCall;
};
// // Creates: tap(x => sendEventToBackpage(metadata, x, subUuid, random))
// const createTapsendEventToBackpageExpression = (metadata, event: ts.ParameterDeclaration, subUuid: string) => (operator: string): ts.Expression => {
//     const sendEvent = ts.createIdentifier('sendEventToBackpage');
//     const lambda = ts.createArrowFunction(
//       undefined,
//       undefined,
//       [event],
//       undefined,
//       undefined,
//       ts.createCall(sendEvent, undefined, [metadata, ts.createLiteral(operator), ts.createIdentifier('x'), ts.createLiteral(subUuid)])
//     );
//     const tapExpression = ts.createCall(ts.createIdentifier('tap'), undefined, [lambda]);
//     return tapExpression;
//   };
// // Inject new argument for every given argument.
// const injectArguments = (args: ts.NodeArray<ts.Expression>, tapExpr: (operator: string) => ts.Expression): ts.NodeArray<ts.Expression> => {
//   const newArgs: ts.Expression[] = [];
//   newArgs.push(tapExpr('initial'));
//   args.forEach((el) => {
//     newArgs.push(el);
//     newArgs.push(tapExpr(el.getText()));
//   });
//   return ts.createNodeArray(newArgs);
// };
// // Inject pipe with a tap operation: tap(x => console.log(x))
// const createInjectedPipeExpression = (node: ts.CallExpression): ts.CallExpression => {
//   const observableMetadata = getObservableMetadata(node);
//   const subUuid = observableMetadata ? observableMetadata.uuid : '0';
//   const parameter = ts.createParameter(
//     undefined,
//     undefined,
//     undefined,
//     ts.createIdentifier('x')
//   );
//   const operator = node.getText();
//   const metadata = createMetaDataExpression(node, operator);
//   const tapExpressionCreator = createTapsendEventToBackpageExpression(metadata, parameter, subUuid);
//   const newArguments = injectArguments(node.arguments, tapExpressionCreator);
//   const newExpression = { ...node, arguments: newArguments };
//   return newExpression;
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
        var foundRxJSCreationOperator = false;
        function visit(node) {
            var realVisit = function (node) {
                // if creation operator, wrap it.
                var _a = isRxJSCreationOperator(node), isCreationOperator = _a[0], operator = _a[1];
                if (isCreationOperator) {
                    foundRxJSCreationOperator = true;
                    return createWrapperExpression(node, operator);
                }
                // if pipe operator, inject it.
                if (isPipeOperator(node)) {
                    try {
                        node = operator_wrapper_1.wrapPipeOperators(node);
                    }
                    catch (e) {
                        console.log(e);
                    }
                    return node;
                    // return createInjectedPipeExpression(node as ts.CallExpression);
                    // return ts.visitEachChild(createInjectedPipeExpression(node as ts.CallExpression), realVisit, context);
                }
                return ts.visitEachChild(node, realVisit, context);
            };
            // Add required imports to sourceFile after visitor pattern.
            var root = realVisit(node);
            return foundRxJSCreationOperator
                ? addWrapperFunctionImportArray(root, ['wrapCreationOperator', 'singleWrapOperatorFunction', 'sendEventToBackpage'])
                : root;
        }
        return ts.visitNode(rootNode, visit);
    };
};
