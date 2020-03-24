import { Observable, MonoTypeOperatorFunction, Subscription, OperatorFunction } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PipeableOperatorMetadata, ObservableMetadata, PipeMetadata, SubscriberMetadata } from '../transformer/metadata';
import { pipeFromArray } from 'rxjs/internal/util/pipe';
declare var chrome;

interface Event<T> {
    data: T;
    observable: string;
    uuid: number;
}

interface SubscribeEvent<T> {
    type: 'COMPLETE' | 'ERROR' | 'NEXT';
    data?: T;
    observable: string;
}

type Payload<T> = PipeMetadata | PipeableOperatorMetadata | ObservableMetadata | SubscriberMetadata | Event<T> | SubscribeEvent<T>;

enum MessageType {
    observable = 'observable',
    pipe = 'pipe',
    operator = 'operator',
    subscribe = 'subscribe',
    subscribeEvent = 'subscribeEvent',
    event = 'event'
}

interface Message<T> {
    type: MessageType;
    message: Payload<T>;
}

// Send given message to the backpage.
const sendToBackpage = <T>(message: Message<T>): void => {
    // chrome.runtime.sendMessage('ichhimaffbaddaokkjkjmlfnbcfkdgih', { detail: message }); 
    chrome.runtime.sendMessage('bgnfinkadkldidemlpeclbennfalaioa', { detail: message });
};

// Create message from given payload.
const createPayloadMessage = <T>(message: Payload<T>, type: MessageType): Message<T> => {
    return { type, message };
}

class Box<T> {
    constructor(public value: T, public id: number) { }
}

let simpleLastUid = 0;

const createEvent = <T>(data: T, observable: string, uuid: number): Event<T> => {
    return { data, observable, uuid };
};

// Unpack given box or event;
const unpack = <T>(event: T | Box<T>, observable: string): { id: number, event: T } => {
    if (event instanceof Box) {
        return { id: event.id, event: event.value };
    } else {
        const id = simpleLastUid++;
        const initialEventMessage = createPayloadMessage<T>(createEvent(event, observable, id), MessageType.event);
        sendToBackpage(initialEventMessage);
        return { id, event };
    }

};

// Wrap creation operator and return it, send data to backpage.
export const wrapCreationOperator = <T extends Array<any>, U>(fn: (...args: T) => U, metadata: ObservableMetadata) => (...args: T) => {
    console.log('Wrapped creation operator ', metadata.identifier);
    const message = createPayloadMessage(metadata, MessageType.observable);
    sendToBackpage(message);
    return fn(...args);
};

// Take source, pipe it, box event with new id, tap box, unpack box and pass along value.
export const wrapPipeableOperator = <T>(operatorFn: MonoTypeOperatorFunction<T>, last: boolean, metadata: PipeableOperatorMetadata) => {
    return (source$: Observable<T>) => {
        console.log(`wrapPipeableOperator ${metadata.line} ${metadata.function} ${metadata.observable}`);
        const message = createPayloadMessage(metadata, MessageType.operator);
        sendToBackpage(message);

        let id: number;
        return source$.pipe(
            map(e => unpack(e, metadata.observable)),
            map(e => {
                id = e.id;
                return e.event;
            }),
            operatorFn,
            tap(e => sendToBackpage(createPayloadMessage<T>(createEvent(e, metadata.observable, id), MessageType.event))),
            tap(e => console.log(`${e} ${metadata.observable} ${id}`)),
            map(e => last ? e : new Box<T>(e, id))
        );
    };
};

// Wrap and return pipe statement.
export const wrapPipe = <T>(source$: Observable<T>, metadata: PipeMetadata, ...operators: OperatorFunction<T, any>[]) => {
    console.log(`wrapped pipe identifier: ${metadata.identifier}  observable: ${metadata.observable} uuid: ${metadata.uuid}`);
    console.log(operators);
    const message = createPayloadMessage(metadata, MessageType.pipe);
    sendToBackpage(message);
    return pipeFromArray([...operators])(source$);
};

type Next<T> = (data: T) => void;
type Error<E> = (error: E) => void;
type Complete = () => void;

// Create SubscribeEvent payload message.
const createSubscribeEventMessage = <T>(type: SubscribeEvent<T>['type'], data: T, observable: string) => {
    const subscribeEvent: SubscribeEvent<T> = { type, data, observable };
    const message = createPayloadMessage(subscribeEvent, MessageType.subscribeEvent);
    return message;
};


// Wrap subscribe and its optional next, error and complete arguments.
export const wrapSubscribe = <T, E>(
    source$: Observable<T>,
    metadata: SubscriberMetadata,
    next?: Next<T>,
    error?: Error<E>,
    complete?: Complete
): Subscription => {
    console.log(`wrapped subscribe ${metadata.observable} pipe ${metadata.pipes[0]}`);
    const message = createPayloadMessage(metadata, MessageType.subscribe);
    sendToBackpage(message);

    let [wrappedNext, wrappedError, wrappedComplete] = [null, null, null];

    if (next) {
        wrappedNext = (event: T) => {
            const eventMessage = createSubscribeEventMessage('NEXT', event, metadata.observable);
            sendToBackpage(eventMessage);
            console.log('wrapped next');
            return next(event);
        };
    }

    if (error) {
        wrappedError = (err: E) => {
            const errMessage = createSubscribeEventMessage('ERROR', err, metadata.observable);
            sendToBackpage(errMessage);
            console.log('wrapped error');
            return error(err);
        };
    }

    if (complete) {
        wrappedComplete = () => {
            const completeMessage = createSubscribeEventMessage('COMPLETE', null, metadata.observable);
            sendToBackpage(completeMessage);
            console.log('wrapped complete');
            return complete();
        };
    }

    return source$.subscribe({
        next: wrappedNext,
        error: wrappedError,
        complete: wrappedComplete
    });
};
