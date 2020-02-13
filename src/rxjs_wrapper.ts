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

export const wrapCreationOperator = (metadata, fn) => <T extends Array<any>, U>(...args: T) => {
    console.log(`wrap operator wrapped with metadata ${metadata}`)
    return fn(...args)
};