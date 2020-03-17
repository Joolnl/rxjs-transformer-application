"use strict";
exports.__esModule = true;
var ts = require("typescript");
var operator_wrapper_1 = require("./operator_wrapper");
var rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
    'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];
// Determine if given node is RxJS Creation Operator Statement.
var isRxJSCreationOperator = function (node) {
    if (!ts.isCallExpression(node)) {
        return [false, null];
    }
    try {
        var operator = rxjsCreationOperators
            .filter(function (operator) { return operator === node.expression.getText(); })
            .pop();
        return operator ? [true, operator] : [false, null];
    }
    catch (e) {
        // console.log(e);
        return [false, null];
    }
};
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
// Determine if given node is RxJS Pipe Statement.
var isPipeStatement = function (node) { return isMethodCall(node, 'pipe'); };
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
    isPipeStatement(node) && (classification = 'RXJS_PIPE_OPERATOR');
    isSubscribeStatement(node) && (classification = 'RXJS_SUBSCRIBE');
    return [classification, importStatement];
};
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
        case 'RXJS_PIPE_OPERATOR':
            node = operator_wrapper_1.wrapAllPipeableOperators(node);
            break;
        case 'RXJS_SUBSCRIBE':
            console.log('FOUND A SUBSCRIBE CALL MATEY!');
            break;
        default:
            throw new Error('Invalid node classification!');
    }
    ;
    return [node, importStatement];
};
