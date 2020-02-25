"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var MessageType;
(function (MessageType) {
    MessageType["SubscriptionCreation"] = "SubscriptionCreation";
    MessageType["EventPassage"] = "EventPassage";
})(MessageType || (MessageType = {}));
// Send given message to the backpage.
var sendToBackpage = function (message) {
    chrome.runtime.sendMessage('ichhimaffbaddaokkjkjmlfnbcfkdgih', { detail: message }, function (response) {
        // ...
    });
};
// Create message for backpage.
var createMessage = function (messageType, metadata, event, subUuid) {
    return { messageType: messageType, metadata: metadata, event: event, subUuid: subUuid };
};
// Wrap creation operator and return it, send data to backpage.
exports.wrapCreationOperator = function (fn, metadata) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log(metadata.uuid + " " + metadata.line + " " + metadata.operator);
    var message = createMessage(MessageType.SubscriptionCreation, metadata);
    sendToBackpage(message);
    return fn.apply(void 0, args);
}; };
var Box = /** @class */ (function () {
    function Box(value, id) {
        this.value = value;
        this.id = id;
    }
    return Box;
}());
var simpleLastUid = 0;
exports.wrapOperatorFunction = function (metadata) { return function (fn) {
    return function (source) {
        return fn(source).pipe(operators_1.tap(function (e) { return console.log("Tap from wrap " + e); }), operators_1.map(function (e) { return new Box(e, simpleLastUid += 1); }), operators_1.tap(function (e) { return console.log("And the id is " + e.id); }));
    };
}; };
exports.unWrapOperatorFunction = function (metadata) { return function (fn) {
    return function (source) {
        var unpacked = source.pipe(operators_1.tap(function (e) { return console.log("Tap from unwrap " + e.value + " with id " + e.id); }), operators_1.map(function (box) { return box.value; }));
        return fn(unpacked);
    };
}; };
exports.useWrapOperatorFunction = function (metadata) { return function (fn) {
    return function (source) {
        return source.pipe(operators_1.tap(function (e) { return console.log("Tap from use wrap " + e.value + " with id " + e.id); }), operators_1.switchMap(function (box) {
            return fn(rxjs_1.of(box.value)).pipe(operators_1.map(function (result) { return new Box(result, box.id); }));
        }));
    };
}; };
// Take source, pipe it, box event with new id, tap box, unpack box and pass along value.
exports.singleWrapOperatorFunction = function (metadata) { return function (fn) {
    console.log("singleWrapOperatorFunction called!");
    return function (source) {
        return source.pipe(operators_1.map(function (e) { return new Box(e, ++simpleLastUid); }), operators_1.tap(function (e) { return console.log(e); }), operators_1.tap(function (e) { return console.log(e.value); }), operators_1.map(function (e) { return e.value; }));
    };
}; };
// Send event data to backpage.
exports.sendEventToBackpage = function (metadata, operator, event, subUuid, test) {
    console.log(event + " after " + operator + " to sub " + subUuid + " own uuid " + metadata.uuid + " line " + metadata.line);
    console.log("test " + test);
    var message = createMessage(MessageType.EventPassage, metadata, event, subUuid);
    sendToBackpage(message);
};
