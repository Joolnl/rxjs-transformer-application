import { of, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import {
    wrapOperatorFunction, unWrapOperatorFunction, useWrapOperatorFunction, singleWrapOperatorFunction, Metadata
} from '../src/rxjs_wrapper';
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
    const curriedSingleWrapOperatorFunction = singleWrapOperatorFunction(metadata);

    const transformedPipelineN1 = (source$: Observable<number>): Observable<number> => {
        return source$.pipe(
            curriedSingleWrapOperatorFunction(map(n => n += 1))
        );
    };

    const transformedPipelineN3 = (source$: Observable<number>): Observable<number> => {
        return source$.pipe(
            curriedWrapOperatorFunction(map(n => n += 1)),
            curriedUseWrapOperatorFunction(map(n => n)),
            curriedUnwrapOperatorFunction(map(n => n += 2))
        );
    };

    it('pipeline n=1 should add 1 to number', () => {
        testScheduler.run(({cold, expectObservable}) => {
            const values = {a: 1, b: 2, c: 700001};
            const source$ = cold('a-b-c|', values);
            const expectedMarble = 'a-b-c|';
            const expectedValues = {a: 2, b: 3, c: 700002};

            const result$ = transformedPipelineN1(source$);
            expectObservable(result$).toBe(expectedMarble, expectedValues);
        });
    });

    it('pipeline n=3 should add 3 to number', () => {
        testScheduler.run(({ cold, expectObservable }) => {
            const values = { a: 1, b: 2, c: 1000 };
            const source$ = cold('a-b-c|', values);
            const expectedMarble = 'a-b-c|';
            const expectedValues = { a: 4, b: 5, c: 1003 };

            const result$ = transformedPipelineN3(source$);
            expectObservable(result$).toBe(expectedMarble, expectedValues);
        });
    });
});