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
// Replace given callExpression with wrapper callExpression.
var createWrapperExpression = function (expression, operator) {
    var wrapIdentifier = ts.createIdentifier('wrapCreationOperator');
    var metaData = ts.createLiteral('test');
    var innerIdentifier = ts.createIdentifier(operator);
    // TODO: can be cleaner.
    var first = ts.createCall(wrapIdentifier, undefined, [metaData, innerIdentifier]);
    var second = ts.createCall(first, undefined, expression.arguments);
    return second;
};
// Add import to given SourceFile.
// format: import importname as alias from file
var addNamedImportToSourceFile = function (rootNode, importName, alias, file) {
    return ts.updateSourceFileNode(rootNode, __spreadArrays([ts.createImportDeclaration(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, ts.createImportClause(undefined, ts.createNamedImports([ts.createImportSpecifier(ts.createIdentifier("" + importName), ts.createIdentifier("" + alias))])), ts.createLiteral("" + file))], rootNode.statements));
};
// Add array of wrapper functions to given source file node.
var addWrapperFunctionImportArray = function (rootNode, operators) {
    var file = 'rxjs_wrapper';
    operators
        .map(function (operator) { return rootNode = addNamedImportToSourceFile(rootNode, operator, operator, file); });
    return rootNode;
};
// Loops over all nodes, when node matches teststring, replaces the string literal.
exports.dummyTransformer = function (context) {
    return function (rootNode) {
        function visit(node) {
            var operatorsToImport = [];
            var realVisit = function (node) {
                var _a = isRxJSCreationOperator(node), found = _a[0], operator = _a[1];
                // Add found operator to import array once.
                if (found && !operatorsToImport.includes("wrap" + (operator.charAt(0).toUpperCase() + operator.substring(1)))) {
                    operatorsToImport.push("wrap" + (operator.charAt(0).toUpperCase() + operator.substring(1)));
                }
                // Mutate found operator to wrapper version.
                return found
                    ? createWrapperExpression(node, operator)
                    : ts.visitEachChild(node, realVisit, context);
            };
            // TODO: wrapCreationOperator now imported in every file.
            var root = realVisit(node);
            return addNamedImportToSourceFile(root, 'wrapCreationOperator', 'wrapCreationOperator', 'rxjs_wrapper');
        }
        return ts.visitNode(rootNode, visit);
    };
};
