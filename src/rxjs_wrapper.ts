import { FromEventTarget, fromEvent } from 'rxjs/internal/observable/fromEvent';
import { SchedulerLike, asyncScheduler as async, interval, of, range } from 'rxjs';
declare var chrome;

interface Message {
    messageType: MessageType,
    metadata: Metadata,
    event?: any
}

export interface Metadata {
    file: string;
    line: number;
    operator: string;
}

enum MessageType {
    SubscriptionCreation = 'SubscriptionCreation',
    EventPassage = 'EventPassage'
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
    console.log(message);
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
    // sendToBackpageDeprecated(metadata.operator, metadata.line, metadata.file);
    const message = createMessage(MessageType.SubscriptionCreation, metadata);
    sendToBackpage(message);
    return fn(...args);
};

// Send event data to backpage.
export const sendEventToBackpage = (metadata: Metadata, operator: string, event: any): void => {
    console.log(`${event} after ${operator}`);
    // const message = createMessage(MessageType.EventPassage, metadata, event);
    // sendToBackpage(message);
};