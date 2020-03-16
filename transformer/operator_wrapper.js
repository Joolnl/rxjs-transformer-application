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
var metadata_1 = require("./metadata");
// Create wrapped RxJS creation operator expression.
exports.createWrapCreationExpression = function (expression) {
    var operator = expression.expression.getText();
    var metaDataExpression = metadata_1.createObservableMetadataExpression(expression, operator);
    var curriedCall = createWrappedCallExpression('wrapCreationOperator', operator, [metaDataExpression]);
    var completeCall = ts.createCall(curriedCall, undefined, expression.arguments);
    metadata_1.registerObservableMetadata(expression, operator);
    return completeCall;
};
// Returns an expression with given wrapperName wrapping given expression as argument.
var createWrappedCallExpression = function (wrapperName, innerName, args) {
    var wrapIdentifier = ts.createIdentifier(wrapperName);
    var innerIdentifier = ts.createIdentifier(innerName);
    var call = ts.createCall(wrapIdentifier, undefined, __spreadArrays([innerIdentifier], args));
    return call;
};
// Wrap array of pipeable operators.
var wrapPipeableOperatorArray = function (args) {
    var createWrapper = function (pipeOperator, last) {
        var metadata = metadata_1.createPipeableOperatorMetadataExpression(pipeOperator);
        return ts.createCall(ts.createIdentifier('wrapPipeableOperator'), undefined, [pipeOperator, ts.createLiteral(last), metadata]);
    };
    var isLast = function (index) { return args.length - 1 === index; };
    var wrappedOperators = args.map(function (operator, index) { return createWrapper(operator, isLast(index)); });
    return ts.createNodeArray(wrappedOperators);
};
// Wrap all operators in given pipe and return expression.
exports.wrapAllPipeableOperators = function (node) {
    if (!node.arguments.every(function (arg) { return ts.isCallExpression(arg); })) {
        throw new Error("Trying to wrap non-CallExpression! " + node.getText());
    }
    node.arguments = wrapPipeableOperatorArray(node.arguments);
    return node;
};
