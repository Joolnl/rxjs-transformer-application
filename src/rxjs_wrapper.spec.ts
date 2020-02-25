import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { wrapOperatorFunction, unWrapOperatorFunction, useWrapOperatorFunction, singleWrapOperatorFunction } from './rxjs_wrapper';
import { TestScheduler } from 'rxjs/testing';
import { Metadata } from '../transformer/metadata';

describe('Pipeline Wrapper', () => {

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

    const transformedPipelineN2 = (source$: Observable<number>): Observable<number> => {
        return source$.pipe(
            curriedWrapOperatorFunction(map(n => n += 1)),
            curriedUnwrapOperatorFunction(map(n => n += 1))
        );
    };

    const transformedPipelineN3 = (source$: Observable<number>): Observable<number> => {
        return source$.pipe(
            curriedWrapOperatorFunction(map(n => n += 1)),
            curriedUseWrapOperatorFunction(map(n => n)),
            curriedUnwrapOperatorFunction(map(n => n += 2))
        );
    };

    const transformedPipelineN7 = (source$: Observable<number>): Observable<number> => {
        return source$.pipe(
            curriedWrapOperatorFunction(map(n => n += 1)),
            curriedUseWrapOperatorFunction(map(n => n -= 1)),
            curriedUseWrapOperatorFunction(map(n => n += 1)),
            curriedUseWrapOperatorFunction(map(n => n -= 1)),
            curriedUseWrapOperatorFunction(map(n => n += 1)),
            curriedUseWrapOperatorFunction(map(n => n -= 1)),
            curriedUnwrapOperatorFunction(map(n => n += 100))
        );
    };

    it('pipeline n=1 should add 1 to number', () => {
        testScheduler.run(({ cold, expectObservable }) => {
            const values = { a: 1, b: 2, c: 700001 };
            const source$ = cold('a-b-c|', values);
            const expectedMarble = 'a-b-c|';
            const expectedValues = { a: 2, b: 3, c: 700002 };

            const result$ = transformedPipelineN1(source$);
            expectObservable(result$).toBe(expectedMarble, expectedValues);
        });
    });

    it('pipeline n=2 should add 2 to number', () => {
        testScheduler.run(({ cold, expectObservable }) => {
            const values = { a: 1, b: 2, c: 700001 };
            const source$ = cold('a-b-c|', values);
            const expectedMarble = 'a-b-c|';
            const expectedValues = { a: 3, b: 4, c: 700003 };

            const result$ = transformedPipelineN2(source$);
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

    it('pipeline n=7 should add 100 to number', () => {
        testScheduler.run(({ cold, expectObservable }) => {
            const values = { a: 1, b: 2, c: -1000 };
            const source$ = cold('a-b-c|', values);
            const expectedMarble = 'a-b-c|';
            const expectedValues = { a: 101, b: 102, c: -900 };

            const result$ = transformedPipelineN7(source$);
            expectObservable(result$).toBe(expectedMarble, expectedValues);
        });
    });

    it('of(1) should return 1', () => {
        const test5 = of(207207).pipe(
            map(x => x -= 1)
          ).subscribe(x => expect(x).toBe(207206));
    });
});