"use strict";
exports.__esModule = true;
var operators_1 = require("rxjs/operators");
var MessageType;
(function (MessageType) {
    MessageType["observable"] = "observable";
    MessageType["oprator"] = "operator";
    MessageType["event"] = "event";
})(MessageType || (MessageType = {}));
// Send given message to the backpage.
var sendToBackpage = function (message) {
    // chrome.runtime.sendMessage('ichhimaffbaddaokkjkjmlfnbcfkdgih', { detail: message },
    //     function (response) {
    //     });
    chrome.runtime.sendMessage('bgnfinkadkldidemlpeclbennfalaioa', { detail: message }, function (response) {
    });
};
// Create message from given payload.
var createPayloadMessage = function (message, type) {
    return { type: type, message: message };
};
// Wrap creation operator and return it, send data to backpage.
exports.wrapCreationOperator = function (fn, metadata) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log('Wrapped');
    // console.log(`wrapCreationOperator ${metadata.uuid} ${metadata.type} ${metadata.identifier} ${metadata.file} ${metadata.line}`);
    var message = createPayloadMessage(metadata, MessageType.observable);
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
var createEvent = function (data, observable, uuid) {
    return { data: data, observable: observable, uuid: uuid };
};
// TODO: this could turn into a monad?
// Unpack given box or event;
var unpack = function (event, observable) {
    if (event instanceof Box) {
        return { id: event.id, event: event.value };
    }
    else {
        var id = simpleLastUid++;
        var initialEventMessage = createPayloadMessage(createEvent(event, observable, id), MessageType.event);
        sendToBackpage(initialEventMessage);
        return { id: id, event: event };
    }
};
// Take source, pipe it, box event with new id, tap box, unpack box and pass along value.
exports.wrapPipeableOperator = function (operatorFn, last, metadata) { return function (source$) {
    // console.log(`wrapPipeableOperator ${metadata.file} ${metadata.function} ${metadata.line} ${metadata.observable} ${metadata.type}`);
    console.log("wrapPipeableOperator " + metadata.line + " " + metadata["function"] + " " + metadata.observable);
    var message = createPayloadMessage(metadata, MessageType.oprator);
    sendToBackpage(message);
    var id;
    return source$.pipe(operators_1.map(function (e) { return unpack(e, metadata.observable); }), operators_1.map(function (e) {
        id = e.id;
        return e.event;
    }), operatorFn, operators_1.tap(function (e) { return sendToBackpage(createPayloadMessage(createEvent(e, metadata.observable, id), MessageType.event)); }), operators_1.tap(function (e) { return console.log(e + " " + metadata.observable + " " + id); }), operators_1.map(function (e) { return last ? e : new Box(e, id); }));
}; };
// Wrap subscribe and its optional next, error and complete arguments.
exports.wrapSubscribe = function (source$, next, error, complete) {
    var _a = [null, null, null], wrappedNext = _a[0], wrappedError = _a[1], wrappedComplete = _a[2];
    if (next) {
        wrappedNext = function (event) {
            console.log('wrapped next');
            return next(event);
        };
    }
    if (error) {
        wrappedError = function (err) {
            console.log('wrapped error');
            return error(err);
        };
    }
    if (complete) {
        wrappedComplete = function () {
            console.log('wrapped complete');
            return complete();
        };
    }
    if (complete)
        return source$.subscribe(wrappedNext, wrappedError, wrappedComplete);
    if (error)
        return source$.subscribe(wrappedNext, wrappedError);
    if (next)
        return source$.subscribe(wrappedNext);
    return source$.subscribe();
};
