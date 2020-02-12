"use strict";
exports.__esModule = true;
var fromEvent_1 = require("rxjs/internal/observable/fromEvent");
var rxjs_1 = require("rxjs");
// import "chrome";
var sendToBackpage = function (operator, line, file) {
    var subscription = { operator: operator, line: line, file: file };
    // chrome.runtime.sendMessage('ichhimaffbaddaokkjkjmlfnbcfkdgih', { detail: subscription },
    //     function (response) {
    //         // ...
    //     });
};
exports.wrapFromEvent = function (target, eventName, options, resultSelector) {
    console.log('fromEvent subscription created.');
    sendToBackpage('fromEvent', 0, 0);
    return fromEvent_1.fromEvent(target, eventName, options, resultSelector);
};
exports.wrapInterval = function (period, scheduler) {
    if (period === void 0) { period = 0; }
    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
    console.log('interval subscription created.');
    sendToBackpage('interval', 1, 0);
    return rxjs_1.interval(period, scheduler);
};
exports.wrapRange = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log('wrapRange operator created.');
    console.log(args);
    return rxjs_1.range.apply(void 0, args);
};
exports.wrapOf = function (metadata, fn) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log("wrapOf operator wrapped with metadata " + metadata);
    return fn.apply(void 0, args);
}; };
// Takes function and arguments, sends metadata en calls given function with arguments.
exports.wrapOfCurry = function (meta, fn) { return function (args) {
    console.log('test');
    //TODO: need to compile this file and check if given arguments is correct.
    return fn.apply(void 0, args);
}; };
