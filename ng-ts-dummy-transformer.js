"use strict";
exports.__esModule = true;
var ts = require("typescript");
var rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
    'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];
var isTestString = function (node) {
    return node === "'TESTSTRING'";
};
var createStringLiteral = function () {
    // console.log('\ncreating new literal\n');
    return ts.createStringLiteral('!@#$%#$%');
};
// For testing, examine passed in node.
var examineNode = function (node) {
    console.log("stringLiteral: " + node.getText() + " " + ts.isStringLiteral(node));
};
var isRxJSCreationOperator = function (node) {
    return rxjsCreationOperators.includes(node) ? true : false;
};
// Replace given CallExpression with wrapperReplacementExcpression.
var replaceRxjsCreationOperator = function (expression) {
};
// Loops over all nodes, when node matches teststring, replaces the string literal.
exports.dummyTransformer = function (context) {
    return function (rootNode) {
        function visit(node) {
            if (ts.isCallExpression(node)) {
                var expression = node;
                var isRxJsOperator = isRxJSCreationOperator(expression.expression.getText());
                console.log(ts.SyntaxKind.CallExpression === node.kind);
                console.log(expression.expression.getText() + " : " + isRxJsOperator);
                var functionName = ts.createIdentifier('wrapFromEvent');
                var newExpression = ts.createCall(functionName, undefined, expression.arguments);
            }
            return isTestString(node.getText())
                // ? ts.visitEachChild(createStringLiteral(), visit, context)
                ? createStringLiteral()
                : ts.visitEachChild(node, visit, context);
            // return ts.visitEachChild(node, visit, context);
        }
        return ts.visitNode(rootNode, visit);
    };
};
