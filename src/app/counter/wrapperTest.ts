// import { interval } from 'rxjs';

// export const wrapTest = () => {
//     const test2 = wrapFuncCurry('metadata', interval);
//     test2([1000]).subscribe(i => console.log(i));
// };

// const wrapFunc = <T extends Array<any>, U>(fn: (...args: T) => U, args: T) => {
//     console.log('test');
//     // return (...args: T): U => fn(...args);
//     return fn(...args);
// };

// const wrapFuncCurry = <T extends Array<any>, U>(meta: string, fn: (...args: T) => U) => (args: T) => {
//     console.log(meta);
//     return fn(...args);
// };
