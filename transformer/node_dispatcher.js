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
    if (ts.isPropertyAccessExpression(node)) {
        return node.name.getText() === 'pipe' ? true : false;
    }
    return false;
};
// Determine if given node is RxJS Subscribe Statement.
var isSubscribeStatement = function (node) { return isMethodCall(node, 'subscribe'); };
// Wrap operator into wrapOperator.
var wrap = function (operator) {
    var capitalized = operator[0].toUpperCase() + operator.slice(1);
    return "wrap" + capitalized;
};
// Classify given node, return node classification and import statement.
var classify = function (node) {
    var classification = 'UNCLASSIFIED';
    var importStatement = null;
    var _a = isRxJSCreationOperator(node), foundCreationOperator = _a[0], creationOperator = _a[1];
    if (foundCreationOperator) {
        classification = 'RXJS_CREATION_OPERATOR';
        importStatement = wrap(creationOperator);
    }
    if (isPipePropertyAccessExpr(node)) {
        if (ts.isVariableDeclaration(node.parent.parent)) {
            classification = 'RXJS_PIPE_VAR_DECL';
        }
        else {
            classification = 'RXJS_PIPE_EXPR_STMT';
        }
    }
    isSubscribeStatement(node) && (classification = 'RXJS_SUBSCRIBE');
    return [classification, importStatement];
};
// TODO: split RXJS_PIPE_OPERATOR in RXJS_PIPE_EXPR_STMT en RXJS_PIPE_VAR_STMT
// Transforms node if necassary, returns original or transformed node along required import statement.
exports.dispatchNode = function (node) {
    var _a = classify(node), nodeType = _a[0], importStatement = _a[1];
    switch (nodeType) {
        case 'UNCLASSIFIED':
            // Unclassified, not transforming.
            break;
        case 'RXJS_CREATION_OPERATOR':
            node = operator_wrapper_1.createWrapCreationExpression(node);
            break;
        case 'RXJS_CREATION_VAR_DECL':
            break;
        case 'RXJS_CREATION_EXPR_STMT':
            break;
        case 'RXJS_PIPE_VAR_DECL':
            node = operator_wrapper_1.wrapPipeStatement(node);
            break;
        case 'RXJS_PIPE_EXPR_STMT':
            node = operator_wrapper_1.wrapAnonymousPipeStatement(node);
            break;
        case 'RXJS_SUBSCRIBE':
            node = operator_wrapper_1.wrapSubscribeMethod(node);
            break;
        default:
            throw new Error('Invalid node classification!');
    }
    return [node, importStatement];
};
