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
exports.extractMetaData = function (expression) {
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
// For Observable expression register metadata.
exports.registerObservableMetadata = function (observable, operator) {
    try {
        var metadata = exports.extractMetaData(observable);
        observableMetadata.set(metadata.identifier, __assign({ operator: operator }, metadata));
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
// TODO: requries: observable name, observable type, uuid, file and line for observable.
// Create metadata object literal expression from expression and operator.
exports.createObservableMetadataExpression = function (expression, operator) {
    var _a = exports.extractMetaData(expression), line = _a.line, file = _a.file, uuid = _a.uuid, identifier = _a.identifier;
    var uuidProperty = ts.createPropertyAssignment('uuid', ts.createLiteral(uuid));
    var fileProperty = ts.createPropertyAssignment('file', ts.createLiteral(file));
    var lineProperty = ts.createPropertyAssignment('line', ts.createNumericLiteral(line.toString()));
    var operatorProperty = ts.createPropertyAssignment('operator', ts.createLiteral(operator));
    var identifierProperty = ts.createPropertyAssignment('identifier', ts.createLiteral(identifier));
    var metaData = ts.createObjectLiteral([uuidProperty, fileProperty, lineProperty, operatorProperty, identifierProperty]);
    return metaData;
};
