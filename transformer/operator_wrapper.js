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
// Returns an expression with given wrapperName wrapping given expression as argument.
exports.createWrappedCallExpression = function (wrapperName, innerName, args) {
    var wrapIdentifier = ts.createIdentifier(wrapperName);
    var innerIdentifier = ts.createIdentifier(innerName);
    var call = ts.createCall(wrapIdentifier, undefined, __spreadArrays([innerIdentifier], args));
    return call;
};
// Wrap array of pipeable operators.
var wrapOperatorArray = function (args) {
    var createWrapper = function (pipeOperator, last) {
        return ts.createCall(ts.createIdentifier('singleWrapOperatorFunction'), undefined, [pipeOperator, ts.createLiteral(last)]);
    };
    var isLast = function (index) {
        return args.length - 1 === index;
    };
    var result = args.map(function (operator, index) { return createWrapper(operator, isLast(index)); });
    return ts.createNodeArray(result);
};
// Wrap all operators in given pipe and return expression.
exports.wrapPipeOperators = function (node) {
    if (!node.arguments.every(function (arg) { return ts.isCallExpression(arg); })) {
        throw new Error("Trying to wrap non-CallExpression! " + node.getText());
    }
    node.arguments = wrapOperatorArray(node.arguments);
    return node;
};
