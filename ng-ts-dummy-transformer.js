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
// Checks if call expression is in rxjsCreationOperators array.
var isRxJSCreationOperator = function (node) {
    return rxjsCreationOperators.includes(node) ? true : false;
};
// Checks if node is fromEvent call expression.
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
// Add import to given SourceFile.
// format: import importname as alias from file
var addNamedImportToSourceFile = function (rootNode, importName, alias, file) {
    return ts.updateSourceFileNode(rootNode, __spreadArrays([ts.createImportDeclaration(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, ts.createImportClause(undefined, ts.createNamedImports([ts.createImportSpecifier(ts.createIdentifier("" + importName), ts.createIdentifier("" + alias))])), ts.createLiteral("" + file))], rootNode.statements));
};
// visitNode<T extends Node>(node: T | undefined, visitor: Visitor | undefined, test?: (node: Node) => boolean, lift?: (node: NodeArray<Node>) => T): T; 
var wrapVisitNode = function (node, visitor, fromEvent, test, lift) {
    console.log("\n" + fromEvent + " " + fromEventExpressionFound + " " + node.getSourceFile().fileName);
    if (test && lift) {
        return ts.visitNode(node, visitor, test, lift);
    }
    else if (test) {
        return ts.visitNode(node, visitor, test);
    }
    else {
        return ts.visitNode(node, visitor);
    }
};
// Loops over all nodes, when node matches teststring, replaces the string literal.
// TODO: the fromEventExpressionFound flag is set after the wrapVisitNode is executed.
exports.dummyTransformer = function (context) {
    return function (rootNode) {
        function visit(node) {
            var fromEventExpressionFound = false;
            var realVisit = function (node) {
                if (isFromEventExpression(node)) {
                    fromEventExpressionFound = true;
                    console.log('isFromEventExpression', node.getSourceFile().fileName);
                    // return createWrapperExpression(node as ts.CallExpression);
                    return ts.visitEachChild(createWrapperExpression(node), realVisit, context);
                }
                else {
                    return ts.visitEachChild(node, realVisit, context);
                }
            };
            var root = realVisit(node);
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
