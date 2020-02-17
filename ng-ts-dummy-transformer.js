"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
// Determine if callExpression is pipe operator.
var isPipeOperator = function (node) {
    if (!ts.isCallExpression(node)) {
        return false;
    }
    var result = node.getChildren()
        .filter(function (node) { return ts.isPropertyAccessExpression(node); })
        .filter(function (node) { return node.name.getText() === 'pipe'; });
    return result.length ? true : false;
};
// Create metadata object from expression and operator.
var createMetaData = function (expression, operator) {
    var line = expression.getSourceFile().getLineAndCharacterOfPosition(expression.getStart()).line;
    var file = expression.getSourceFile().fileName;
    var fileProperty = ts.createPropertyAssignment('file', ts.createLiteral(file));
    var lineProperty = ts.createPropertyAssignment('line', ts.createNumericLiteral(line.toString()));
    var operatorProperty = ts.createPropertyAssignment('operator', ts.createLiteral(operator));
    var metaData = ts.createObjectLiteral([fileProperty, lineProperty, operatorProperty]);
    return metaData;
};
// Replace given callExpression with wrapper callExpression.
var createWrapperExpression = function (expression, operator) {
    var metaData = createMetaData(expression, operator);
    var wrapIdentifier = ts.createIdentifier('wrapCreationOperator');
    var innerIdentifier = ts.createIdentifier(operator);
    var curriedCall = ts.createCall(wrapIdentifier, undefined, [metaData, innerIdentifier]);
    var completeCall = ts.createCall(curriedCall, undefined, expression.arguments);
    return completeCall;
};
// TODO: use flatmap
// Inject new argument for every given argument.
var injectArguments = function (args, newArg) {
    var newArgs = [];
    args.forEach(function (el) {
        newArgs.push(el);
        newArgs.push(newArg);
    });
    return ts.createNodeArray(newArgs);
};
// Inject pipe with a tap operation: tap(x => console.log(x))
var createInjectedPipeExpression = function (node) {
    var parameter = ts.createParameter(undefined, undefined, undefined, ts.createIdentifier('x'));
    var operator = node.getText();
    var metadata = createMetaData(node, operator);
    var sendEvent = ts.createIdentifier('sendEventToBackpage');
    var lambda = ts.createArrowFunction(undefined, undefined, [parameter], undefined, undefined, ts.createCall(sendEvent, undefined, [metadata, ts.createIdentifier('x')]));
    var tapExpression = ts.createCall(ts.createIdentifier('tap'), undefined, [lambda]);
    // const newArguments = ts.createNodeArray([tapExpression, ...node.arguments, tapExpression]);
    var newArguments = injectArguments(node.arguments, tapExpression);
    var newExpression = __assign(__assign({}, node), { arguments: newArguments });
    return newExpression;
};
// Add import to given SourceFile.
// format: import importname as alias from file
var addNamedImportToSourceFile = function (rootNode, importName, alias, file) {
    return ts.updateSourceFileNode(rootNode, __spreadArrays([ts.createImportDeclaration(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, ts.createImportClause(undefined, ts.createNamedImports([ts.createImportSpecifier(ts.createIdentifier("" + importName), ts.createIdentifier("" + alias))])), ts.createLiteral("" + file))], rootNode.statements));
};
// DEPRECATED:
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
                    return createInjectedPipeExpression(node);
                    // return ts.visitEachChild(createInjectedPipeExpression(node as ts.CallExpression), realVisit, context);
                }
                return ts.visitEachChild(node, realVisit, context);
            };
            // Add required imports to sourceFile after visitor pattern.
            var root = realVisit(node);
            return foundRxJSCreationOperator
                ? addWrapperFunctionImportArray(root, ['wrapCreationOperator', 'sendEventToBackpage'])
                : root;
        }
        return ts.visitNode(rootNode, visit);
    };
};
