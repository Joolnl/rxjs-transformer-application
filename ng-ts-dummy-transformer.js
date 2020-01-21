"use strict";
exports.__esModule = true;
var ts = require("typescript");
var isTestString = function (node) {
    return node === "'TESTSTRING'";
};
var createStringLiteral = function () {
    console.log('creating new literal');
    return ts.createStringLiteral('!@#$%#$%');
};
// Loops over all nodes, when node matches teststring, replaces the string literal.
exports.dummyTransformer = function (context) {
    return function (rootNode) {
        function visit(node) {
            return isTestString(node.getText())
                // ? ts.visitEachChild(createStringLiteral(), visit, context)
                ? createStringLiteral()
                : ts.visitEachChild(node, visit, context);
            // return ts.visitEachChild(node, visit, context);
        }
        return ts.visitNode(rootNode, visit);
    };
};
