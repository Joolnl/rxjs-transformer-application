"use strict";
exports.__esModule = true;
// import "chrome";
var sendToBackpage = function (operator, line, file) {
    var subscription = { operator: operator, line: line, file: file };
    // chrome.runtime.sendMessage('ichhimaffbaddaokkjkjmlfnbcfkdgih', { detail: subscription },
    //     function (response) {
    //         // ...
    //     });
};
exports.wrapCreationOperator = function (metadata, fn) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log("wrap operator wrapped with metadata " + metadata);
    return fn.apply(void 0, args);
}; };
