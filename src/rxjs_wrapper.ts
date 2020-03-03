import { Observable, MonoTypeOperatorFunction, Operator, Subscriber } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MetadataDeprecated, PipeableOperatorMetadata } from '../transformer/metadata';
declare var chrome;

interface Message {
    type: string;
    observable?: {
        uuid: string;
        type: string;
        identifier: string;
    };
    operator?: {
        uuid: string;
        type: string;
        function: string;
        observable: string;
    };
    event?: {
        data: any;
        observable: string;
        uuid: string;
        index: number;
    }
    metadata: {
        file: string;
        line: number;
    }
}

interface MessageDeprecated {
    messageType: MessageType,
    metadata: MetadataDeprecated,
    event?: any,
    subUuid?: string
}

enum MessageType {
    SubscriptionCreation = 'SubscriptionCreation',
    EventPassage = 'EventPassage'
}

// Send given message to the backpage.
const sendToBackpage = (message: MessageDeprecated): void => {
    chrome.runtime.sendMessage('bgnfinkadkldidemlpeclbennfalaioa', { detail: message },
        function (response) {
            // ...
        });
};

// Create message for backpage.
const createMessage = (messageType: MessageType, metadata: MetadataDeprecated, event?: any, subUuid?: string): MessageDeprecated => {
    return { messageType, metadata, event, subUuid };
};

// Wrap creation operator and return it, send data to backpage.
export const wrapCreationOperator = <T extends Array<any>, U>(fn: (...args: T) => U, metadata: MetadataDeprecated) => (...args: T) => {
    console.log(`${metadata.uuid} ${metadata.line} ${metadata.file} ${metadata.operator} ${metadata.identifier}`);
    const message = createMessage(MessageType.SubscriptionCreation, metadata);
    sendToBackpage(message);
    console.log('Sent to backpage.');
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
export const wrapPipeableOperator = <T>(operatorFn: MonoTypeOperatorFunction<T>, last: boolean, metadata: PipeableOperatorMetadata) => (source$: Observable<T>) => {
    console.log(`wrapPipeableOperator type ${metadata.file} ${metadata.function} ${metadata.line} ${metadata.observable} ${metadata.type}`);
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
export const sendEventToBackpage = (metadata: MetadataDeprecated, operator: string, event: any, subUuid: string, test: number): void => {
    console.log(`${event} after ${operator} to sub ${subUuid} own uuid ${metadata.uuid} line ${metadata.line}`);
    console.log(`test ${test}`);
    const message = createMessage(MessageType.EventPassage, metadata, event, subUuid);
    sendToBackpage(message);
};