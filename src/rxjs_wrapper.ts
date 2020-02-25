import { Observable, MonoTypeOperatorFunction } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Metadata } from '../transformer/metadata';
declare var chrome;

interface Message {
    messageType: MessageType,
    metadata: Metadata,
    event?: any,
    subUuid?: string
}

enum MessageType {
    SubscriptionCreation = 'SubscriptionCreation',
    EventPassage = 'EventPassage'
}

// Send given message to the backpage.
const sendToBackpage = (message: Message): void => {
    chrome.runtime.sendMessage('ichhimaffbaddaokkjkjmlfnbcfkdgih', { detail: message },
        function (response) {
            // ...
        });
};

// Create message for backpage.
const createMessage = (messageType: MessageType, metadata: Metadata, event?: any, subUuid?: string): Message => {
    return { messageType, metadata, event, subUuid };
};

// Wrap creation operator and return it, send data to backpage.
export const wrapCreationOperator = <T extends Array<any>, U>(fn: (...args: T) => U, metadata: Metadata) => (...args: T) => {
    console.log(`${metadata.uuid} ${metadata.line} ${metadata.operator}`);
    const message = createMessage(MessageType.SubscriptionCreation, metadata);
    sendToBackpage(message);
    return fn(...args);
};

class Box<T> {
    constructor(public value: T, public id: number) { }
}

let simpleLastUid: number = 0;

// Unpack given box or event;
const unpack = <T>(event: T | Box<T>): { id: number, event: T } => {
    if (event instanceof Box) {
        return { id: event.id, event: event.value };
    } else {
        return { id: ++simpleLastUid, event: event };
    }

};

// Take source, pipe it, box event with new id, tap box, unpack box and pass along value.
export const singleWrapOperatorFunction = <T>(operatorFn: MonoTypeOperatorFunction<T>, last: boolean) => (source$: Observable<T>) => {
    let id: number;
    return source$.pipe(
        map(e => unpack(e)),
        map(e => {
            id = e.id;
            return e.event
        }),
        operatorFn,
        tap(e => console.log(`${id} ${e}`)),
        map(e => last ? e : new Box<T>(e, id))
    );
};

// Send event data to backpage.
export const sendEventToBackpage = (metadata: Metadata, operator: string, event: any, subUuid: string, test: number): void => {
    console.log(`${event} after ${operator} to sub ${subUuid} own uuid ${metadata.uuid} line ${metadata.line}`);
    console.log(`test ${test}`);
    const message = createMessage(MessageType.EventPassage, metadata, event, subUuid);
    sendToBackpage(message);
};