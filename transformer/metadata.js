"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var ts = require("typescript");
var v5 = require("uuid/v5");
var observableMetadata = new Map();
// Generate unique id from seed: filename and line.
var generateId = function (filename, line) {
    var uuid = v5("" + filename + line, 'e01462c8-517f-11ea-8d77-2e728ce88125');
    return uuid;
};
// Extract metadata from given call expression.
exports.extractMetadata = function (expression) {
    var line = expression.getSourceFile().getLineAndCharacterOfPosition(expression.getStart()).line;
    var file = expression.getSourceFile().fileName;
    var uuid = generateId(file, line);
    var identifier;
    if (ts.isVariableDeclaration(expression.parent)) {
        var variableDeclaration = expression.parent;
        identifier = variableDeclaration.name.getText();
    }
    return { line: line, file: file, uuid: uuid, identifier: identifier };
};
// TODO: registering under only identifier might bug with two likely named identifiers in seperate files.
// For Observable expression register metadata.
exports.registerObservableMetadata = function (observable, operator) {
    try {
        var metadata = exports.extractMetadata(observable);
        var identifier = metadata.identifier;
        console.log("registering observable " + metadata.identifier + " " + metadata.uuid);
        observableMetadata.set(identifier, __assign({ type: operator }, metadata));
    }
    catch (error) {
        throw error;
    }
};
// Get metadata of epxressions subscribtion.
exports.getObservableMetadata = function (node) {
    var observableIdentifier = node.getChildren()
        .filter(function (n) { return ts.isPropertyAccessExpression(n); })
        .map(function (n) { return n.expression.getText(); })
        .pop();
    if (!observableIdentifier) {
        throw new Error('No observable identifier found in node! Possible anonymous observable?');
    }
    return observableMetadata.get(observableIdentifier);
};
var createProperty = function (name, value) { return ts.createPropertyAssignment(name, ts.createLiteral(value || '')); };
// Create metadata object literal expression from expression and operator.
exports.createObservableMetadataExpression = function (expression, operator) {
    var _a = exports.extractMetadata(expression), line = _a.line, file = _a.file, uuid = _a.uuid, identifier = _a.identifier;
    return ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('type', operator),
        createProperty('identifier', identifier),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};
// TODO: should contain: operator type, function body, observable uuid, file, line
exports.createPipeableOperatorMetadataExpression = function (expression) {
    var operator = expression.expression.getText();
    var functionBody = expression.arguments.map(function (arg) { return arg.getText(); }).join('');
    var _a = exports.extractMetadata(expression), file = _a.file, line = _a.line;
    var observable;
    if (ts.isCallExpression(expression.parent)) {
        if (ts.isPropertyAccessExpression(expression.parent.expression)) {
            var identifier = expression.parent.expression.expression.getText();
            try {
                observable = observableMetadata.get(identifier).uuid;
            }
            catch (e) {
                observable = 'anonymous';
            }
        }
    }
    return ts.createObjectLiteral([
        createProperty('type', operator),
        createProperty('function', functionBody),
        createProperty('observable', observable),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};
