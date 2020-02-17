"use strict";
exports.__esModule = true;
var MessageType;
(function (MessageType) {
    MessageType[MessageType["SubscriptionCreation"] = 0] = "SubscriptionCreation";
    MessageType[MessageType["EventPassage"] = 1] = "EventPassage";
})(MessageType || (MessageType = {}));
var sendToBackpageDeprecated = function (operator, line, file) {
    var subscription = { operator: operator, line: line, file: file };
    chrome.runtime.sendMessage('ichhimaffbaddaokkjkjmlfnbcfkdgih', { detail: subscription }, function (response) {
        // ...
    });
};
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
    sendToBackpageDeprecated(metadata.operator, metadata.line, metadata.file);
    return fn.apply(void 0, args);
}; };
// Send event data to backpage.
exports.sendEventToBackpage = function (metadata, operator, event) {
    console.log(event + " after " + operator);
    // const message = createMessage(MessageType.EventPassage, metadata, event);
    // sendToBackpage(message);
};
