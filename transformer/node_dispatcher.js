"use strict";
exports.__esModule = true;
var ts = require("typescript");
var operator_wrapper_1 = require("./operator_wrapper");
var rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
    'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];
// Determine if given node is RxJS Creation Operator Statement.
var isRxJSCreationOperator = function (node) {
    try {
        if (!ts.isCallExpression(node)) {
            return [false, null];
        }
        var operator = rxjsCreationOperators
            .filter(function (o) { return o === node.expression.getText(); })
            .pop();
        return operator ? [true, operator] : [false, null];
    }
    catch (e) {
        // console.log(e);
        return [false, null];
    }
};
// Determine if given node is given method call.
var isMethodCall = function (node, method) {
    try {
        if (!ts.isCallExpression(node)) {
            return false;
        }
        var result = node.getChildren()
            .filter(function (child) { return ts.isPropertyAccessExpression(child); })
            .filter(function (child) { return child.name.getText() === method; });
        return result.length ? true : false;
    }
    catch (e) {
        return false;
    }
};
// Check if node is pipe property access expression.
var isPipePropertyAccessExpr = function (node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        return node.expression.name.getText() === 'pipe' ? true : false;
    }
    return false;
};
// Determine if given node is RxJS Subscribe Statement.
var isSubscribeStatement = function (node) { return isMethodCall(node, 'subscribe'); };
// Classify given node, return node classification and import statement.
var classify = function (node) {
    var classification = 'UNCLASSIFIED';
    // TODO: creationOperator deprecated.
    var _a = isRxJSCreationOperator(node), foundCreationOperator = _a[0], creationOperator = _a[1];
    if (foundCreationOperator) {
        classification = 'RXJS_CREATION_OPERATOR';
    }
    if (isPipePropertyAccessExpr(node)) {
        if (ts.isVariableDeclaration(node.parent)) {
            classification = 'RXJS_PIPE_VAR_DECL';
        }
        else {
            classification = 'RXJS_PIPE_EXPR_STMT';
        }
    }
    isSubscribeStatement(node) && (classification = 'RXJS_SUBSCRIBE');
    return classification;
};
// Transforms node if necassary, returns original or transformed node along required import statement.
exports.dispatchNode = function (node) {
    var nodeType = classify(node);
    switch (nodeType) {
        case 'UNCLASSIFIED':
            return [node, null];
        case 'RXJS_CREATION_OPERATOR':
            node = operator_wrapper_1.createWrapCreationExpression(node);
            return [node, 'wrapCreationOperator'];
        case 'RXJS_PIPE_VAR_DECL':
            node = operator_wrapper_1.wrapPipeStatement(node);
            return [node, 'wrapPipe'];
        case 'RXJS_PIPE_EXPR_STMT':
            node = operator_wrapper_1.wrapAnonymousPipeStatement(node);
            return [node, 'wrapPipe'];
        case 'RXJS_SUBSCRIBE':
            node = operator_wrapper_1.wrapSubscribeMethod(node);
            return [node, 'wrapSubscribe'];
        default:
            throw new Error('Invalid node classification!');
    }
};
