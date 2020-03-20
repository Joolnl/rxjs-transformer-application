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
// Store data by file, line and pos.
var NodeMap = /** @class */ (function () {
    function NodeMap() {
        var _this = this;
        this.key = function (file, line, pos) { return file + line + pos; };
        this.get = function (file, line, pos) {
            return _this.data.get(_this.key(file, line, pos));
        };
        this.set = function (file, line, pos, data) {
            _this.data.set(_this.key(file, line, pos), data);
        };
        this.data = new Map();
    }
    return NodeMap;
}());
var observableMapDeprecated = new FileMap();
var pipeMap = new FileMap();
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
// Map named pipe to named observable if both non-anonymous.
exports.registerPipe = function (pipeUUID, pipeIdentifier, node) {
    if (ts.isVariableDeclaration(node.parent)) {
        var file = node.getSourceFile().getText();
        var observableIdentifier = node.parent.name.getText();
        var observable = observableMapDeprecated.get(observableIdentifier, file);
        if (observable) {
            console.log('Registering pipe inside metadata');
            var pipeInfo = { pipeUUID: pipeUUID, observableUUID: observable.uuid };
            pipeMap.set(pipeIdentifier, file, pipeInfo);
        }
    }
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
exports.createPipeMetadataExpression = function (node, identifier, uuid) {
    var _a = exports.extractMetadata(node), line = _a.line, file = _a.file;
    var _b = exports.extractMetadata(getObservable(node).parent), observableFile = _b.file, observableLine = _b.line, observablePos = _b.pos;
    var observable = generateId(observableFile, observableLine, observablePos);
    console.log("observable " + observable);
    var observableUUID;
    if (ts.isPropertyAccessExpression(node.expression)) { // TODO: there might be more nodes between pipe and original observable?
        var observableIdentifier = node.expression.expression.getText();
        var observable_1 = observableMapDeprecated.get(observableIdentifier, file);
        if (observable_1) {
            observableUUID = observable_1.uuid;
        }
    }
    else if (identifier) {
        var pipeInfo = pipeMap.get(identifier, file);
        if (pipeInfo) {
            observableUUID = pipeInfo.observableUUID;
        }
    }
    return ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('observable', observableUUID),
        createProperty('identifier', identifier),
        createProperty('file', file),
        createProperty('line', line)
    ]);
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
