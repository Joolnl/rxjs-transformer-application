import { FromEventTarget, fromEvent } from 'rxjs/internal/observable/fromEvent';
import { SchedulerLike, asyncScheduler as async, interval, of, range } from 'rxjs';
// import "chrome";
declare var chrome;

interface Message {
    messageType: MessageType,
    metadata: Metadata,
    event?: any
}

interface Metadata {
    file: string;
    line: number;
    operator: string;
}

enum MessageType {
    SubscriptionCreation,
    EventPassage
}

const sendToBackpageDeprecated = (operator, line, file) => {
    const subscription = { operator, line, file };
    chrome.runtime.sendMessage('ichhimaffbaddaokkjkjmlfnbcfkdgih', { detail: subscription },
        function (response) {
            // ...
        });
};

// Send given message to the backpage.
const sendToBackpage = (message: Message): void => {
    chrome.runtime.sendMessage('ichhimaffbaddaokkjkjmlfnbcfkdgih', { detail: message },
        function (response) {
            // ...
        });
};

// Create message for backpage.
const createMessage = (messageType: MessageType, metadata: Metadata, event?: any): Message => {
    return { messageType, metadata, event };
};

// Wrap creation operator and return it, send data to backpage.
export const wrapCreationOperator = <T extends Array<any>, U>(metadata: Metadata, fn: (...args: T) => U) => (...args: T) => {
    sendToBackpageDeprecated(metadata.operator, metadata.line, metadata.file);
    return fn(...args);
};

// Send event data to backpage.
export const sendEventToBackpage = (metadata: Metadata, event: any): void => {
    console.log(metadata.operator);
    // const message = createMessage(MessageType.EventPassage, metadata, event);
    // sendToBackpage(message);
};