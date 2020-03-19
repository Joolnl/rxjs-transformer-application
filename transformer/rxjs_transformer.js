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
var node_dispatcher_1 = require("./node_dispatcher");
// Add import to given SourceFile.
// format: import importname as alias from file
var addNamedImportToSourceFile = function (rootNode, importName, alias, file) {
    return ts.updateSourceFileNode(rootNode, __spreadArrays([ts.createImportDeclaration(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, ts.createImportClause(undefined, ts.createNamedImports([ts.createImportSpecifier(ts.createIdentifier("" + importName), ts.createIdentifier("" + alias))])), ts.createLiteral("" + file))], rootNode.statements));
};
// Add array of wrapper functions to given source file node.
var addWrapperFunctionImportArray = function (rootNode, operators) {
    var file = 'src/rxjs_wrapper';
    operators
        .filter(function (operator) { return operator !== null; })
        .map(function (operator) { return rootNode = addNamedImportToSourceFile(rootNode, operator, operator, file); });
    return rootNode;
};
// Loops over all nodes, when node matches teststring, replaces the string literal.
exports.dummyTransformer = function (context) {
    return function (rootNode) {
        if (rootNode.fileName.includes('/rxjs_wrapper.ts')) {
            console.log('\nIgnoring rxjs_wrapper.ts');
            return rootNode;
        }
        var importStatements = new Set();
        function visit(node) {
            var realVisit = function (node) {
                var _a = node_dispatcher_1.dispatchNode(node), dispatchedNode = _a[0], wrapperImport = _a[1];
                wrapperImport && importStatements.add(wrapperImport);
                return ts.visitEachChild(dispatchedNode, realVisit, context);
            };
            // Add required imports to sourceFile after visitor pattern.
            var root = realVisit(node);
            // TODO: Optimise imports, now importing these three every file.
            return addWrapperFunctionImportArray(root, __spreadArrays(['sendEventToBackpage', 'wrapPipeableOperator'], Array.from(importStatements)));
        }
        return ts.visitNode(rootNode, visit);
    };
};
