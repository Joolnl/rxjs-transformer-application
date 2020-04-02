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
var uuid = require("uuid/v4");
// Returns an expression with given wrapperName wrapping given expression as argument.
var createWrappedCallExpression = function (wrapperName, innerName, args) {
    var wrapIdentifier = ts.createIdentifier(wrapperName);
    var innerIdentifier = ts.createIdentifier(innerName);
    var call = ts.createCall(wrapIdentifier, undefined, __spreadArrays([innerIdentifier], args));
    return call;
};
// Create wrapped RxJS creation operator expression.
exports.createWrapCreationExpression = function (node) {
    var identifier = node.expression;
    var variableName = ts.isVariableDeclaration(node.parent)
        ? node.parent.name.getText()
        : 'anonymous';
    var metaDataExpression = metadata_1.createObservableMetadataExpression(identifier, variableName);
    var curriedCall = createWrappedCallExpression('wrapCreationOperator', identifier.getText(), [metaDataExpression]);
    var completeCall = ts.createCall(curriedCall, undefined, node.arguments);
    return completeCall;
};
// Create wrapped RxJS join creation operator expression.
exports.createWrapJoinCreationExpression = function (node) {
    var identifier = node.expression;
    var variableName = ts.isVariableDeclaration(node.parent)
        ? node.parent.name.getText()
        : 'anonymous';
    var metaDataExpression = metadata_1.createJoinObservableMetadataExpression(identifier, node, variableName);
    return node; // TODO: return mutated node.
};
// Wrap array of pipeable operators.
var wrapPipeableOperatorArray = function (args, pipeUUID, observableUUID) {
    if (!args.every(function (operator) { return ts.isCallExpression(operator); })) {
        throw new Error('Can not wrap pipe operators, invalid NodeArray!');
    }
    var createWrapper = function (pipeOperator, last) {
        var metadata = metadata_1.createPipeableOperatorMetadataExpression(pipeOperator, uuid(), pipeUUID, observableUUID);
        return ts.createCall(ts.createIdentifier('wrapPipeableOperator'), undefined, [pipeOperator, ts.createLiteral(last), metadata]);
    };
    var isLast = function (index) { return args.length - 1 === index; };
    var wrappedOperators = args.map(function (operator, index) { return createWrapper(operator, isLast(index)); });
    return ts.createNodeArray(wrappedOperators);
};
// Wrap pipe and all its operators.
exports.wrapPipeStatement = function (node) {
    var propertyAccessExpr = node.expression;
    var source$ = propertyAccessExpr.expression;
    var identifier = propertyAccessExpr.name;
    var variableName = ts.isVariableDeclaration(node.parent) // TODO: duplicate code extract to function.
        ? node.parent.name.getText()
        : 'anonymous';
    var _a = metadata_1.createPipeMetadataExpression(node, identifier, variableName), metadataExpression = _a[0], pipeUUID = _a[1], observableUUID = _a[2];
    var args = wrapPipeableOperatorArray(node.arguments, pipeUUID, observableUUID).map(function (arg) { return arg; });
    return ts.createCall(ts.createIdentifier('wrapPipe'), undefined, __spreadArrays([source$, metadataExpression], args));
};
// Wrapp subscribe method and return expression.
exports.wrapSubscribeMethod = function (node) {
    var args = node.arguments.map(function (arg) { return arg; }); // ts.NodeArray => array.
    var propertyAccessExpr = node.expression;
    var source$ = propertyAccessExpr.expression;
    var metadata = metadata_1.createSubscriberMetadataExpression(node);
    return ts.createCall(ts.createIdentifier('wrapSubscribe'), undefined, __spreadArrays([source$, metadata], args));
};
