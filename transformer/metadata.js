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
var observableMap = new FileMap();
var pipeMap = new FileMap();
// Generate unique id from seed: filename and line.
var generateId = function (filename, line) {
    var uuid = v5("" + filename + line, 'e01462c8-517f-11ea-8d77-2e728ce88125');
    return uuid;
};
// TODO: generalise function.
// Extract metadata from given call expression.
exports.extractMetadata = function (node) {
    var line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
    var file = node.getSourceFile().fileName;
    var uuid = generateId(file, line);
    var identifier;
    if (ts.isVariableDeclaration(node.parent)) {
        var variableDeclaration = node.parent;
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
        observableMap.set(identifier, metadata.file, __assign({ type: operator }, metadata));
    }
    catch (error) {
        throw error;
    }
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
// Map named pipe to named observable if both non-anonymous.
exports.registerPipe = function (pipeUUID, pipeIdentifier, node) {
    if (ts.isVariableDeclaration(node.parent)) {
        var file = node.getSourceFile().getText();
        var observableIdentifier = node.parent.name.getText();
        var observable = observableMap.get(observableIdentifier, file);
        if (observable) {
            console.log('Registering pipe inside metadata');
            var pipeInfo = { pipeUUID: pipeUUID, observableUUID: observable.uuid };
            pipeMap.set(pipeIdentifier, file, pipeInfo);
        }
    }
};
// Create pipe metadata object literal.
exports.createPipeMetadataExpression = function (node, identifier, uuid) {
    var _a = exports.extractMetadata(node), line = _a.line, file = _a.file;
    var observableUUID;
    if (ts.isPropertyAccessExpression(node.expression)) { // TODO: there might be more nodes between pipe and original observable?
        var observableIdentifier = node.expression.expression.getText();
        var observable = observableMap.get(observableIdentifier, file);
        if (observable) {
            observableUUID = observable.uuid;
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
        var observableObject = observableMap.get(identifier, file);
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
    var observable = observableMap.get(identifier, file);
    var uuid = observable ? observable.uuid : 'anonymous';
    // console.log(`identifier ${identifier} observable ${uuid}`);
    // console.log(`expression ${node.expression.getText()}`);
};
