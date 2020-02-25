"use strict";
exports.__esModule = true;
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
// type WrapOperatorFunction = {
//     <T, S, R>(fn: (s: Observable<S>) => Observable<R>): (
//         s: Observable<S>
//     ) => Observable<Box<R>>;
// };
// type UnWrapOperatorFunction = <T, S, R>(fn: (s: Observable<S>) => Observable<R>) => (
//     s: Observable<Box<S>>
// ) => Observable<R>;
// type UseWrapOperatorFunction = {
//     <T, S, R>(fn: (s: Observable<S>) => Observable<R>): (
//         s: Observable<Box<S>>
//     ) => Observable<Box<R>>;
// };
// type SingleWrapOperatorFunctionDeprecated = {
//     <T, S, R>(fn: (s: Observable<S>) => Observable<R>): (
//         s: Observable<S>
//     ) => Observable<R>;
// };
// type SingleWrapOperatorFunction = (metadata: Metadata) => <T, S, R>(fn: (s: Observable<S>) => Observable<R>) => (source: Observable<S>) => Observable<S | R>
// // Curryable types.
// type WrapOperatorFunctionMetaCurried = (a: Metadata) => WrapOperatorFunction;
// type UnWrapOperatorFunctionMetaCurried = (a: Metadata) => UnWrapOperatorFunction;
// type UseWrapOperatorFunctionMetaCurried = (a: Metadata) => UseWrapOperatorFunction;
// type SingleWrapOperatorMetaCurriedDeprecated = (a: Metadata) => SingleWrapOperatorFunction;
// export const wrapOperatorFunction: WrapOperatorFunctionMetaCurried = (metadata: Metadata) => (fn) => {
//     return source => {
//         return fn(source).pipe(
//             tap(e => console.log(`Tap from wrap ${e}`)),
//             map(e => new Box(e, simpleLastUid += 1)),
//             tap(e => console.log(`And the id is ${e.id}`))
//         );
//     };
// };
// export const unWrapOperatorFunction: UnWrapOperatorFunctionMetaCurried = (metadata: Metadata) => fn => {
//     return source => {
//         const unpacked = source.pipe(
//             tap(e => console.log(`Tap from unwrap ${e.value} with id ${e.id}`)),
//             map(box => box.value)
//         );
//         return fn(unpacked);
//     };
// };
// export const useWrapOperatorFunction: UseWrapOperatorFunctionMetaCurried = (metadata: Metadata) => fn => {
//     return source => {
//         return source.pipe(
//             tap(e => console.log(`Tap from use wrap ${e.value} with id ${e.id}`)),
//             switchMap(box => {
//                 return fn(of(box.value)).pipe(map(result => new Box(result, box.id)));
//             })
//         );
//     };
// };
var simpleLastUid = 0;
// Unpack given box or event;
var unpack = function (event) {
    if (event instanceof Box) {
        return { id: event.id, event: event.value };
    }
    else {
        return { id: ++simpleLastUid, event: event };
    }
};
// Take source, pipe it, box event with new id, tap box, unpack box and pass along value.
exports.singleWrapOperatorFunction = function (operatorFn, last) { return function (source$) {
    var id;
    return source$.pipe(operators_1.map(function (e) { return unpack(e); }), operators_1.map(function (e) {
        id = e.id;
        return e.event;
    }), operatorFn, operators_1.tap(function (e) { return console.log(id + " " + e); }), operators_1.map(function (e) { return last ? e : new Box(e, id); }));
}; };
// Send event data to backpage.
exports.sendEventToBackpage = function (metadata, operator, event, subUuid, test) {
    console.log(event + " after " + operator + " to sub " + subUuid + " own uuid " + metadata.uuid + " line " + metadata.line);
    console.log("test " + test);
    var message = createMessage(MessageType.EventPassage, metadata, event, subUuid);
    sendToBackpage(message);
};
