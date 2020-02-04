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
// import { Expression } from '@angular/compiler';
// import { wrapFromEvent } from './rxjs_wrapper';
var rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
    'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];
var isTestString = function (node) {
    return node === "'TESTSTRING'";
};
var createStringLiteral = function () {
    // console.log('\ncreating new literal\n');
    return ts.createStringLiteral('!@#$%#$%');
};
// For testing, examine passed in node.
var examineNode = function (node) {
    console.log("stringLiteral: " + node.getText() + " " + ts.isStringLiteral(node));
};
var isRxJSCreationOperator = function (node) {
    return rxjsCreationOperators.includes(node) ? true : false;
};
var isFromEventExpression = function (node) {
    if (ts.isCallExpression(node)) {
        if (node.expression.getText() === 'fromEvent') {
            return true;
        }
    }
    return false;
};
// Replace given CallExpression with wrapperReplacementExcpression.
var createWrapperExpression = function (expression) {
    var functionName = ts.createIdentifier('wrapFromEvent');
    var newExpression = ts.createCall(functionName, undefined, expression.arguments);
    return newExpression;
};
var createTestWrapperExpression = function (expression) {
    var functionName = ts.createIdentifier('testWrapper');
    var newExpression = ts.createCall(functionName, undefined, undefined);
    return newExpression;
};
// Loops over all nodes, when node matches teststring, replaces the string literal.
exports.dummyTransformer = function (context) {
    return function (rootNode) {
        var file = rootNode;
        console.log(file.fileName);
        var update = ts.updateSourceFileNode(file, __spreadArrays([ts.createImportDeclaration(
            /*decorators*/ undefined, 
            /*modifiers*/ undefined, ts.createImportClause(undefined, ts.createNamedImports([ts.createImportSpecifier(ts.createIdentifier('wrapFromEvent'), ts.createIdentifier('wrapFromEvent'))])), ts.createLiteral('rxjs_wrapper'))], file.statements));
        ts.visitEachChild(rootNode, visit, context);
        rootNode = update;
        function visit(node) {
            // if (node.kind === 285) {
            //   const file = node as ts.SourceFile;
            //   console.log(file.fileName);
            //   const update = ts.updateSourceFileNode(file,
            //     [ts.createImportDeclaration(
            //     /*decorators*/undefined,
            //     /*modifiers*/ undefined,
            //       ts.createImportClause(
            //         undefined,
            //         ts.createNamedImports([ts.createImportSpecifier(ts.createIdentifier('wrapFromEvent'), ts.createIdentifier('wrapFromEvent'))])
            //       ),
            //       ts.createLiteral('rxjs_wrapper')
            //     ), ...file.statements]);
            //     ts.visitEachChild(node, visit, context);
            //     return update;
            // }
            return isFromEventExpression(node)
                ? createWrapperExpression(node)
                : ts.visitEachChild(node, visit, context);
        }
        return ts.visitNode(rootNode, visit);
    };
};
