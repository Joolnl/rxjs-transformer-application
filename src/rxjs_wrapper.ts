import { Observable, MonoTypeOperatorFunction, Subscription, OperatorFunction } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PipeableOperatorMetadata, ObservableMetadata } from '../transformer/metadata';
declare var chrome;

interface Event<T> {
    data: T;
    observable: string;
    uuid: number;
}

type Payload<T> = PipeableOperatorMetadata | ObservableMetadata | Event<T>;

enum MessageType {
    observable = 'observable',
    oprator = 'operator',
    event = 'event'
}

interface Message<T> {
    type: MessageType;
    message: Payload<T>;
}

// Send given message to the backpage.
const sendToBackpage = <T>(message: Message<T>): void => {
    // chrome.runtime.sendMessage('ichhimaffbaddaokkjkjmlfnbcfkdgih', { detail: message },
    //     function (response) {
    //     });
    chrome.runtime.sendMessage('bgnfinkadkldidemlpeclbennfalaioa', { detail: message });
};

// Create message from given payload.
const createPayloadMessage = <T>(message: Payload<T>, type: MessageType): Message<T> => {
    return { type, message };
}

// Wrap creation operator and return it, send data to backpage.
export const wrapCreationOperator = <T extends Array<any>, U>(fn: (...args: T) => U, metadata: ObservableMetadata) => (...args: T) => {
    console.log('Wrapped creation operator');
    // console.log(`wrapCreationOperator ${metadata.uuid} ${metadata.type} ${metadata.identifier} ${metadata.file} ${metadata.line}`);
    const message = createPayloadMessage(metadata, MessageType.observable);
    sendToBackpage(message);
    return fn(...args);
};

class Box<T> {
    constructor(public value: T, public id: number) { }
}

let simpleLastUid = 0;

const createEvent = <T>(data: T, observable: string, uuid: number): Event<T> => {
    return { data, observable, uuid };
}

// TODO: this could turn into a monad?
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

// Take source, pipe it, box event with new id, tap box, unpack box and pass along value.
export const wrapPipeableOperator = <T>(operatorFn: MonoTypeOperatorFunction<T>, last: boolean, metadata: PipeableOperatorMetadata) => (source$: Observable<T>) => {
    // console.log(`wrapPipeableOperator ${metadata.file} ${metadata.function} ${metadata.line} ${metadata.observable} ${metadata.type}`);
    console.log(`wrapPipeableOperator ${metadata.line} ${metadata.function} ${metadata.observable}`);
    const message = createPayloadMessage(metadata, MessageType.oprator);
    sendToBackpage(message);

    let id: number;
    return source$.pipe(
        map(e => unpack(e, metadata.observable)),
        map(e => {
            id = e.id;
            return e.event
        }),
        operatorFn,
        tap(e => sendToBackpage(createPayloadMessage<T>(createEvent(e, metadata.observable, id), MessageType.event))),
        tap(e => console.log(`${e} ${metadata.observable} ${id}`)),
        map(e => last ? e : new Box<T>(e, id))
    );
};

export const wrapPipe = <T, R>(source$: Observable<T>, ...operators: []) => {
    console.log('wrapped pipe!');
    // console.log(operators);
    // return source$.pipe.apply(operators);
    // operators.map((_, i) => console.log(i));
    // console.log(operators[0]);

    return source$.pipe(...operators);
};

type Next<T> = (data: T) => void;
type Error<E> = (error: E) => void;
type Complete = () => void;

// Wrap subscribe and its optional next, error and complete arguments.
export const wrapSubscribe = <T, E>(source$: Observable<T>, next?: Next<T>, error?: Error<E>, complete?: Complete): Subscription => {
    let [wrappedNext, wrappedError, wrappedComplete] = [null, null, null];

    if (next) {
        wrappedNext = (event: T) => {
            console.log('wrapped next');
            return next(event);
        };
    }

    if (error) {
        wrappedError = (err: E) => {
            console.log('wrapped error');
            return error(err);
        };
    }

    if (complete) {
        wrappedComplete = () => {
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
