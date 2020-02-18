"use strict";
exports.__esModule = true;
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
var createMessage = function (messageType, metadata, event) {
    return { messageType: messageType, metadata: metadata, event: event };
};
// Wrap creation operator and return it, send data to backpage.
exports.wrapCreationOperator = function (metadata, fn) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log(metadata.uuid + " " + metadata.line + " " + metadata.operator);
    var message = createMessage(MessageType.SubscriptionCreation, metadata);
    sendToBackpage(message);
    return fn.apply(void 0, args);
}; };
// Send event data to backpage.
exports.sendEventToBackpage = function (metadata, operator, event, subUuid) {
    console.log(event + " after " + operator + " to sub " + subUuid + " own uuid " + metadata.uuid + " line " + metadata.line);
    var message = createMessage(MessageType.EventPassage, metadata, event);
    sendToBackpage(message);
};
