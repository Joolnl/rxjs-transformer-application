"use strict";
exports.__esModule = true;
var ts = require("typescript");
var rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
    'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];
// Determine if given node is RxJS Creation Operator Statement.
var isRxJSCreationOperator = function (node) {
    if (!ts.isCallExpression(node)) {
        return [false, null];
    }
    var operator = rxjsCreationOperators
        .filter(function (operator) { return operator === node.expression.getText(); })
        .pop();
    return operator ? [true, operator] : [false, null];
};
// Determine if given node is RxJS Pipe Statement.
var isPipeStatement = function (node) {
    if (!ts.isCallExpression(node)) {
        return false;
    }
    var result = node.getChildren()
        .filter(function (child) { return ts.isPropertyAccessExpression(child); })
        .filter(function (child) { return child.name.getText() === 'pipe'; });
    return result.length ? true : false;
};
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
    var foundPipeStatement = isPipeStatement(node);
    if (foundPipeStatement) {
        classification = 'RXJS_PIPE_OPERATOR';
    }
    return [classification, importStatement];
};
// Transforms node if necassary, returns original or transformed node along required import statement.
exports.dispatchNode = function (node) {
    var _a = classify(node), nodeType = _a[0], importStatement = _a[1];
    nodeType !== 'UNCLASSIFIED' && console.log("\nnodeType: " + nodeType + " importStatement " + importStatement);
    switch (nodeType) {
        case 'UNCLASSIFIED':
            break;
        case 'RXJS_CREATION_OPERATOR':
            // node = null;
            break;
        case 'RXJS_PIPE_OPERATOR':
            break;
        default:
            throw new Error('Invalid node classification!');
    }
    ;
    return [node, importStatement];
};
