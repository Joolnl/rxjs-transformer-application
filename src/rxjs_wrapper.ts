import { FromEventTarget, fromEvent } from 'rxjs/internal/observable/fromEvent';
import { SchedulerLike, asyncScheduler as async, interval, of, range } from 'rxjs';
// import "chrome";

const sendToBackpage = (operator, line, file) => {
    const subscription = { operator, line, file };
    // chrome.runtime.sendMessage('ichhimaffbaddaokkjkjmlfnbcfkdgih', { detail: subscription },
    //     function (response) {
    //         // ...
    //     });
};

export const wrapFromEvent = <T>(target: FromEventTarget<T>, eventName: string,
    options?: EventListenerOptions, resultSelector?: (...args: any[]) => T) => {
    console.log('fromEvent subscription created.');
    sendToBackpage('fromEvent', 0, 0);

    return fromEvent(target, eventName, options, resultSelector);
};


export const wrapInterval = (period: number = 0, scheduler: SchedulerLike = async) => {
    console.log('interval subscription created.');
    sendToBackpage('interval', 1, 0);

    return interval(period, scheduler);
};

export const wrapRange = <T extends Array<any>, U>(...args: T) => {
    console.log('wrapRange operator created.');
    console.log(args);
    return range(...args);
};

export const wrapOf = (metadata, fn) => <T extends Array<any>, U>(...args: T) => {
    console.log(`wrapOf operator wrapped with metadata ${metadata}`)
    return fn(...args)
};