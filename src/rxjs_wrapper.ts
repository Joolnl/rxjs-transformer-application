import { FromEventTarget, fromEvent } from 'rxjs/internal/observable/fromEvent';
import { SchedulerLike, asyncScheduler as async, interval, of, range } from 'rxjs';
// import "chrome";

interface Metadata {
    file: string;
    line: number;
    operator: string;
}

const sendToBackpage = (operator, line, file) => {
    const subscription = { operator, line, file };
    // chrome.runtime.sendMessage('ichhimaffbaddaokkjkjmlfnbcfkdgih', { detail: subscription },
    //     function (response) {
    //         // ...
    //     });
};

export const wrapCreationOperator = <T extends Array<any>, U>(metadata: Metadata, fn: (...args: T) => U) => (...args: T) => {
    console.log(`${metadata.operator} at ${metadata.line} in ${metadata.file}`);
    return fn(...args);
};