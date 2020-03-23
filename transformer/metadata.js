"use strict";
exports.__esModule = true;
var ts = require("typescript");
var v5 = require("uuid/v5");
var namedPipes = new Map();
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
    if (variableName !== 'anonymous') {
        namedPipes.set(variableName, uuid);
    }
    var objectLiteral = ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('observable', observableUUID),
        createProperty('identifier', variableName),
        createProperty('file', file),
        createProperty('line', line)
    ]);
    return [objectLiteral, uuid, observableUUID];
};
// Create operator metadata object literal.
exports.createPipeableOperatorMetadataExpression = function (node, pipeUUID, observableUUID) {
    var operator = node.expression.getText();
    var functionBody = node.arguments.map(function (arg) { return arg.getText(); }).join('');
    var _a = exports.extractMetadata(node), file = _a.file, line = _a.line;
    return ts.createObjectLiteral([
        createProperty('type', operator),
        createProperty('function', functionBody),
        createProperty('observable', observableUUID),
        createProperty('pipe', pipeUUID),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};
// Recursively get all pipes a subscribe belongs to. 0...n
var getPipeArray = function (node, pipes) {
    var result = pipes ? pipes : [];
    if (ts.isPropertyAccessExpression(node) || ts.isCallExpression(node)) {
        if (ts.isPropertyAccessExpression(node) && node.name.getText() === 'pipe') {
            result.push({ node: node.name, anonymous: true });
        }
        else if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.name.getText() === 'subscribe') {
            result.push({ node: node.expression, anonymous: false });
        }
        return getPipeArray(node.expression, result);
    }
    return result;
};
// Create subscribe metadata object literal.
exports.createSubscriberMetadataExpression = function (node) {
    console.log('creating subscribe metadata expression.');
    // const identifier = getIdentifier(node);
    var _a = exports.extractMetadata(node), file = _a.file, line = _a.line;
    var observableMetadata = exports.extractMetadata(getObservable(node));
    var observableUUID = generateId(observableMetadata.file, observableMetadata.line, observableMetadata.pos);
    var pipes = getPipeArray(node);
    // Generate UUID for anonymous pipes.
    var anonymousPipes = pipes
        .filter(function (pipe) { return pipe.anonymous; })
        .map(function (pipe) { return pipe.node; })
        .map(function (pipeNode) { return exports.extractMetadata(pipeNode); })
        .map(function (metadata) { return generateId(metadata.file, metadata.line, metadata.pos); });
    // Fetch already generated UUID's for non-anonymous pipes.
    var nonAnonymousPipes = pipes
        .filter(function (pipe) { return !pipe.anonymous; })
        .map(function (pipe) { return pipe.node; })
        .map(function (pipeNode) { return pipeNode.getText(); })
        .map(function (pipeName) { return namedPipes.get(pipeName); });
    anonymousPipes.concat(nonAnonymousPipes).map(function (pipe) { return console.log("pipe uuid: " + pipe); });
};
