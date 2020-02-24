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
// Returns an expression with given wrapperName wrapping given expression as argument.
exports.createWrappedCallExpression = function (wrapperName, innerName, args) {
    var wrapIdentifier = ts.createIdentifier(wrapperName);
    var innerIdentifier = ts.createIdentifier(innerName);
    var call = ts.createCall(wrapIdentifier, undefined, __spreadArrays([innerIdentifier], args));
    return call;
};
// const createCurriedWrapCallExpression: CurriedCallExpressionFn = (metadata, wrapperName, innerName, args) {
// };
var createTestTapExpression = function () {
    var parameter = ts.createParameter(undefined, undefined, undefined, ts.createIdentifier('x'));
    var consoleLog = ts.createPropertyAccess(ts.createIdentifier('console'), ts.createIdentifier('log'));
    var lambda = ts.createArrowFunction(undefined, undefined, [parameter], undefined, undefined, ts.createCall(consoleLog, undefined, [ts.createIdentifier('x')]));
    var tapExpression = ts.createCall(ts.createIdentifier('tap'), undefined, [lambda]);
    return lambda;
};
// TODO: turn all operator arguments into wrappedCallExpressions
// TODO: determine where to place logic to choose appropriate wrapper, like single, frist, last...
// TODO: probably also require for seperate functions for building the arguments array
// TODO: but a single function to create the curried wrapper call.
var argArrayToWrappedArgArray = function (args, metaData) {
    var result = args.map(function (arg) {
        var a = exports.createWrappedCallExpression('singleWrapOperatorFunction', 'map', [metadata_1.createMetaDataExpression(arg, 'map')]);
        var b = ts.createCall(a, undefined, arg.arguments);
        return b;
    });
    return ts.createNodeArray(result);
};
// Wrap all operators in given pipe and return expression.
exports.wrapPipeOperators = function (node) {
    if (!node.arguments.every(function (arg) { return ts.isCallExpression(arg); })) {
        throw new Error("Trying to wrap non-CallExpression! " + node.getText());
    }
    console.log("Coming here in wrapPipeOperators with arguments:  " + node.arguments.length);
    var metaData = metadata_1.extractMetaData(node);
    if (node.arguments.length === 1) {
        node.arguments = argArrayToWrappedArgArray(node.arguments, metaData);
    }
    return node;
};
