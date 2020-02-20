import { of, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { wrapOperatorFunction, unWrapOperatorFunction, useWrapOperatorFunction, Metadata } from '../src/rxjs_wrapper';
import { TestScheduler } from 'rxjs/testing';

describe('Pipeline Transformer', () => {

    let testScheduler: TestScheduler;
    beforeEach(() => {
        testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });
    });

    const metadata: Metadata = {
        uuid: '6ced7567-0277-497f-9465-4d225e190090',
        file: 'ng-ts-dummy-transformer.spec.ts',
        line: 20,
        operator: 'map'
    };
    const curriedWrapOperatorFunction = wrapOperatorFunction(metadata);
    const curriedUnwrapOperatorFunction = unWrapOperatorFunction(metadata);
    const curriedUseWrapOperatorFunction = useWrapOperatorFunction(metadata);

    const transformedPipeline = (source$: Observable<number>): Observable<number> => {
        return source$.pipe(
            curriedWrapOperatorFunction(map(n => n += 1)),
            curriedUseWrapOperatorFunction(map(n => n)),
            curriedUnwrapOperatorFunction(map(n => n += 2))
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