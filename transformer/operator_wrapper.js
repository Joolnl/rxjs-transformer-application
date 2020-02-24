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
// TODO: turn all operator arguments into wrappedCallExpressions
// TODO: determine where to place logic to choose appropriate wrapper, like single, frist, last...
// TODO: probably also require for seperate functions for building the arguments array
// TODO: but a single function to create the curried wrapper call.
var argArrayToWrappedArgArray = function (args, metaData) {
    // map(x => x += 1)
    var wrapIdentifier = ts.createIdentifier('singleWrapOperatorFunction');
    var result = args.map(function (arg) {
        return ts.createCall(wrapIdentifier, undefined, [arg]);
    });
    return ts.createNodeArray(result);
};
// Wrap all operators in given pipe and return expression.
exports.wrapPipeOperators = function (node) {
    if (!node.arguments.every(function (arg) { return ts.isCallExpression(arg); })) {
        throw new Error("Trying to wrap non-CallExpression! " + node.getText());
    }
    var metaData = metadata_1.extractMetaData(node);
    if (node.arguments.length === 1) {
        node.arguments = argArrayToWrappedArgArray(node.arguments, metaData);
    }
    return node;
};
