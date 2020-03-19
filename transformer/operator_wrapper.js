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
var uuid = require("uuid/v4");
var metadata_1 = require("./metadata");
// Returns an expression with given wrapperName wrapping given expression as argument.
var createWrappedCallExpression = function (wrapperName, innerName, args) {
    var wrapIdentifier = ts.createIdentifier(wrapperName);
    var innerIdentifier = ts.createIdentifier(innerName);
    var call = ts.createCall(wrapIdentifier, undefined, __spreadArrays([innerIdentifier], args));
    return call;
};
// Create wrapped RxJS creation operator expression.
exports.createWrapCreationExpression = function (expression) {
    var operator = expression.expression.getText();
    var metaDataExpression = metadata_1.createObservableMetadataExpression(expression, operator);
    var curriedCall = createWrappedCallExpression('wrapCreationOperator', operator, [metaDataExpression]);
    var completeCall = ts.createCall(curriedCall, undefined, expression.arguments);
    metadata_1.registerObservableMetadata(expression, operator);
    return completeCall;
};
// Wrap array of pipeable operators.
var wrapPipeableOperatorArray = function (args, pipeIdentifier) {
    if (!args.every(function (operator) { return ts.isCallExpression(operator); })) {
        throw new Error('Can not wrap pipe operators, invalid NodeArray!');
    }
    var createWrapper = function (pipeOperator, last) {
        var metadata = metadata_1.createPipeableOperatorMetadataExpression(pipeOperator, pipeIdentifier);
        return ts.createCall(ts.createIdentifier('wrapPipeableOperator'), undefined, [pipeOperator, ts.createLiteral(last), metadata]);
    };
    var isLast = function (index) { return args.length - 1 === index; };
    var wrappedOperators = args.map(function (operator, index) { return createWrapper(operator, isLast(index)); });
    return ts.createNodeArray(wrappedOperators);
};
// // TODO: clean up function.
// const wrapPipeOperators2 = (node: ts.PropertyAccessExpression, pipeUUID: string): Array<ts.CallExpression> => {
//   if (!ts.isCallExpression(node.parent)) {
//     throw new Error('Can not wrap pipe operators, can not acces arguments!');
//   }
//   const args = node.parent.arguments;
//   if (!args.every(operator => ts.isCallExpression(operator))) {
//     throw new Error('Can not wrap pipe operators, invalid NodeArray!');
//   }
//   const createWrapper = (pipeOperator: ts.CallExpression, last: boolean) => {
//     const metadata = createPipeableOperatorMetadataExpression(pipeOperator, pipeUUID);
//     return ts.createCall(ts.createIdentifier('wrapPipeableOperator'), undefined, [pipeOperator, ts.createLiteral(last), metadata]);
//   };
//   const isLast = (index: number) => args.length - 1 === index;
//   return args.map((operator, index) => createWrapper(operator as ts.CallExpression, isLast(index)));
// };
// const wrapPipeOperators = (node: ts.PropertyAccessExpression, pipeIdentifier?: string): ts.PropertyAccessExpression => {
//   if (ts.isCallExpression(node.parent)) {
//     node.parent.arguments = wrapPipeableOperatorArray(node.parent.arguments, pipeIdentifier);
//     return node;
//   } else {
//     throw new Error('Can not wrap pipe!');
//   }
// };
// const getPipeIdentifierDeprecated = (node: ts.PropertyAccessExpression): string => {
//   if (ts.isCallExpression(node.parent) && ts.isVariableDeclaration(node.parent.parent)) {
//     return node.parent.parent.name.getText();
//   }
//   throw new Error('Can not find pipe identifier!');
// };
var getPipeIdentifier = function (node) {
    if (ts.isCallExpression(node) && ts.isVariableDeclaration(node.parent)) {
        return node.parent.name.getText();
    }
    throw new Error('Can not find pipe identifier!');
};
// Wrap pipe and all its operators.
exports.wrapPipeStatement = function (node, anonymous) {
    var pipeUUID = uuid();
    if (!anonymous) {
        var identifier = getPipeIdentifier(node);
        metadata_1.registerPipe(pipeUUID, identifier, node);
    }
    var propertyAccessExpr = node.expression;
    var source$ = propertyAccessExpr.expression;
    node.arguments = wrapPipeableOperatorArray(node.arguments, pipeUUID);
    var args = node.arguments.map(function (arg) { return arg; }); // ts.NodeArray => array.
    return ts.createCall(ts.createIdentifier('wrapPipe'), undefined, __spreadArrays([source$], args));
};
// // Wrap anonymous pipe and all its operators.
// export const wrapAnonymousPipeStatement = (node: ts.CallExpression): ts.CallExpression => {
//   const propertyAccessExpr = node.expression as ts.PropertyAccessExpression;
//   const source$ = propertyAccessExpr.expression;
//   node.arguments = wrapPipeableOperatorArray(node.arguments, uuid());
//   const args = node.arguments.map(arg => arg); // ts.NodeArray => array.
//   return ts.createCall(ts.createIdentifier('wrapPipe'), undefined, [source$, ...args]);
// };
// Wrapp subscribe method and return expression.
exports.wrapSubscribeMethod = function (node) {
    var args = node.arguments.map(function (arg) { return arg; }); // ts.NodeArray => array.
    var propertyAccessExpr = node.expression;
    var source$ = propertyAccessExpr.expression;
    metadata_1.createSubscriberMetadataExpression(node);
    return ts.createCall(ts.createIdentifier('wrapSubscribe'), undefined, __spreadArrays([source$], args));
};
