import { of, Observable } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
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

type WrapOperatorFunction = {
    <T, S, R>(fn: (s: Observable<S>) => Observable<R>): (
        s: Observable<S>
    ) => Observable<Box<R>>;
};

type UnWrapOperatorFunction = <T, S, R>(fn: (s: Observable<S>) => Observable<R>) => (
    s: Observable<Box<S>>
) => Observable<R>;

type UseWrapOperatorFunction = {
    <T, S, R>(fn: (s: Observable<S>) => Observable<R>): (
        s: Observable<Box<S>>
    ) => Observable<Box<R>>;
};

type SingleWrapOperatorFunction = {
    <T, S, R>(fn: (s: Observable<S>) => Observable<R>): (
        s: Observable<S>
    ) => Observable<R>;
};

// Curryable types.
type WrapOperatorFunctionMetaCurried = (a: Metadata) => WrapOperatorFunction;
type UnWrapOperatorFunctionMetaCurried = (a: Metadata) => UnWrapOperatorFunction;
type UseWrapOperatorFunctionMetaCurried = (a: Metadata) => UseWrapOperatorFunction;
type SingleWrapOperatorMetaCurried = (a: Metadata) => SingleWrapOperatorFunction;


let simpleLastUid: number = 0;

export const wrapOperatorFunction: WrapOperatorFunctionMetaCurried = (metadata: Metadata) => (fn) => {
    return source => {
        return fn(source).pipe(
            tap(e => console.log(`Tap from wrap ${e}`)),
            map(e => new Box(e, simpleLastUid += 1)),
            tap(e => console.log(`And the id is ${e.id}`))
        );
    };
};

export const unWrapOperatorFunction: UnWrapOperatorFunctionMetaCurried = (metadata: Metadata) => fn => {
    return source => {
        const unpacked = source.pipe(
            tap(e => console.log(`Tap from unwrap ${e.value} with id ${e.id}`)),
            map(box => box.value)
        );
        return fn(unpacked);
    };
};

export const useWrapOperatorFunction: UseWrapOperatorFunctionMetaCurried = (metadata: Metadata) => fn => {
    return source => {
        return source.pipe(
            tap(e => console.log(`Tap from use wrap ${e.value} with id ${e.id}`)),
            switchMap(box => {
                return fn(of(box.value)).pipe(map(result => new Box(result, box.id)));
            })
        );
    };
};

export const singleWrapOperatorFunction: SingleWrapOperatorMetaCurried = (metadata: Metadata) => fn => {
    console.log(`singleWrapOperatorFunction called!`);
    // return fn;
    return source => {
        return fn(source).pipe(
            tap(e => console.log(new Box(e, ++simpleLastUid).value))
        );
    };
};

// Send event data to backpage.
export const sendEventToBackpage = (metadata: Metadata, operator: string, event: any, subUuid: string, test: number): void => {
    console.log(`${event} after ${operator} to sub ${subUuid} own uuid ${metadata.uuid} line ${metadata.line}`);
    console.log(`test ${test}`);
    const message = createMessage(MessageType.EventPassage, metadata, event, subUuid);
    sendToBackpage(message);
};