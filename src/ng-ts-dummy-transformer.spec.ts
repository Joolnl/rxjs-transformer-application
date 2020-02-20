import { of, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { wrapOperatorFunction, unWrapOperatorFunction, useWrapOperatorFunction } from '../src/rxjs_wrapper';
import { TestScheduler } from 'rxjs/testing';

describe('Pipeline Transformer', () => {

    let testScheduler: TestScheduler;
    beforeEach(() => {
        testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });
    });

    const transformedPipeline = (source$: Observable<number>): Observable<number> => {
        return source$.pipe(
            wrapOperatorFunction(map(n => n += 1)),
            useWrapOperatorFunction(map(n => n)),
            unWrapOperatorFunction(map(n => n += 2))
        );
    };

    it('should add 3', () => {
        testScheduler.run(({ cold, expectObservable }) => {
            const values = { a: 1, b: 2, c: 1000 };
            const source$ = cold('a-b-c|', values);
            const expectedMarble = 'a-b-c|';
            const expectedValues = { a: 4, b: 5, c: 1003 };

            const result$ = transformedPipeline(source$);
            expectObservable(result$).toBe(expectedMarble, expectedValues);
        });
    });
});