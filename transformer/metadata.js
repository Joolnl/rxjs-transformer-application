"use strict";
exports.__esModule = true;
var ts = require("typescript");
var v5 = require("uuid/v5");
// For storing data by identifier and file origin.
var FileMap = /** @class */ (function () {
    function FileMap() {
        var _this = this;
        this.key = function (identifier, file) { return identifier + file; };
        this.get = function (identifier, file) {
            return _this.data.get(_this.key(identifier, file));
        };
        this.set = function (identifier, file, data) {
            _this.data.set(_this.key(identifier, file), data);
        };
        this.data = new Map();
    }
    return FileMap;
}());
var observableMapDeprecated = new FileMap();
// Generate unique id from seed: filename, line and pos.
var generateId = function (filename, line, pos) {
    var uuid = v5("" + filename + line + pos, 'e01462c8-517f-11ea-8d77-2e728ce88125');
    return uuid;
};
// Extract metadata from given call expression.
exports.extractMetadata = function (node) {
    var file = node.getSourceFile().fileName;
    var line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
    var pos = node.pos;
    return { file: file, line: line, pos: pos };
};
var createProperty = function (name, value) { return ts.createPropertyAssignment(name, ts.createLiteral(value || '')); };
// Create metadata object literal expression from expression and operator.
exports.createObservableMetadataExpression = function (node, variableName) {
    var _a = exports.extractMetadata(node), file = _a.file, line = _a.line, pos = _a.pos;
    var uuid = generateId(file, line, pos);
    return ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('type', node.getText()),
        createProperty('identifier', variableName),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};
// Traverse tree until observable is found.
var getObservable = function (node) {
    if (ts.isPropertyAccessExpression(node) || ts.isCallExpression(node)) {
        return getObservable(node.expression);
    }
    else if (ts.isIdentifier(node)) {
        return node;
    }
    else {
        throw new Error('No Observable found!');
    }
};
// Create pipe metadata object literal.
exports.createPipeMetadataExpression = function (node, identifier, variableName) {
    var _a = exports.extractMetadata(identifier), file = _a.file, line = _a.line, pos = _a.pos;
    var uuid = generateId(file, line, pos);
    var observableMetadata = exports.extractMetadata(getObservable(node));
    var observableUUID = generateId(observableMetadata.file, observableMetadata.line, observableMetadata.pos);
    var objectLiteral = ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('observable', observableUUID),
        createProperty('identifier', variableName),
        createProperty('file', file),
        createProperty('line', line)
    ]);
    return [objectLiteral, uuid];
};
// Create operator metadata object literal.
exports.createPipeableOperatorMetadataExpression = function (node, pipeIdentifier) {
    var operator = node.expression.getText();
    var functionBody = node.arguments.map(function (arg) { return arg.getText(); }).join('');
    var _a = exports.extractMetadata(node), file = _a.file, line = _a.line;
    var observable;
    if (ts.isCallExpression(node.parent) && ts.isPropertyAccessExpression(node.parent.expression)) {
        var identifier = node.parent.expression.expression.getText();
        var observableObject = observableMapDeprecated.get(identifier, file);
        observable = observableObject ? observableObject.uuid : 'anonymous';
    }
    return ts.createObjectLiteral([
        createProperty('type', operator),
        createProperty('function', functionBody),
        createProperty('observable', observable),
        createProperty('pipe', pipeIdentifier),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};
var getIdentifier = function (node) {
    if (ts.isCallExpression(node) || ts.isPropertyAccessExpression(node)) {
        return getIdentifier(node.expression);
    }
    return node.getText();
};
exports.createSubscriberMetadataExpression = function (node) {
    var identifier = getIdentifier(node);
    var _a = exports.extractMetadata(node), file = _a.file, line = _a.line;
    var observable = observableMapDeprecated.get(identifier, file);
    var uuid = observable ? observable.uuid : 'anonymous';
    // console.log(`identifier ${identifier} observable ${uuid}`);
    // console.log(`expression ${node.expression.getText()}`);
};
