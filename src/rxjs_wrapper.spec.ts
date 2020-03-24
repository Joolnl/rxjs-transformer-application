import { Observable, from } from 'rxjs';
import { toArray, map } from 'rxjs/operators';
import { wrapCreationOperator, wrapPipeableOperator, wrapPipe, wrapSubscribe } from './rxjs_wrapper';
import { ObservableMetadata, PipeMetadata, PipeableOperatorMetadata, SubscriberMetadata } from '../transformer/metadata';
import { TestScheduler } from 'rxjs/testing';
import * as uuid from 'uuid/v4';

describe('RxJS Wrappers', () => {

    let testScheduler: TestScheduler;
    beforeEach(() => {
        testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });
    });

    const observableMetadata: ObservableMetadata = {
        uuid: uuid(),
        identifier: 'mock',
        file: 'rxjs_wrapper.spec.ts',
        line: 17
    };

    const createWrappedCreationOperator = (input: Array<number>): Observable<number> => {
        return wrapCreationOperator(from, observableMetadata)(input);
    };


    it('wrapCreationOperator should return observabvle and shouldn\'t alter stream.', () => {
        const input = [1, 2, 3];
        const source$ = createWrappedCreationOperator(input);

        source$.pipe(toArray()).subscribe((result: number[]) => {
            expect(input).toEqual(result);
        });
    });

    const pipeMetadata: PipeMetadata = {
        uuid: uuid(),
        observable: uuid(),
        file: 'rxjs_wrapper.spec.ts',
        line: 38
    };

    // TODO: test if to array works

    it('wrapPipe should return observable and shouldn\'t alter stream.', () => {
        const input = ['a', 'b', 'c'];
        const source$ = from(input);
        wrapPipe(source$, pipeMetadata, map(e => e))
            .pipe(toArray())
            .subscribe((result: string[]) => {
                expect(input).toEqual(result);
            });
    });

    const pipeOperatorMetadata: PipeableOperatorMetadata = {
        type: 'map',
        function: 'x => x',
        observable: uuid(),
        pipe: uuid(),
        file: 'rxjs_wrapper.spec.ts',
        line: 57
    };

    it('Wrapped pipe oporators shouldn\' alter logic.', () => {
        const input = [1, 2, 3];
        const wrappedMap = wrapPipeableOperator(map(x => x), true, pipeOperatorMetadata);
        from(input)
            .pipe(wrappedMap, toArray())
            .subscribe((result: number[]) => {
                expect(input).toEqual(result);
            });
    });

    const subscriberMetadata: SubscriberMetadata = {
        observable: uuid(),
        pipes: [],
        func: '(result: number[]) => expect(input).toEqual(result)',
        file: 'rxjs_wrapper.spec.ts',
        line: 76
    };

    it('Wrapped subscribe shouldn\'t alter stream.', () => {
        const input = [1, 2, 3];
        const source$ = from(input).pipe(toArray());
        wrapSubscribe(source$, subscriberMetadata,
            (result: number[]) => {
                expect(input).toEqual(result);
            });
    });
});
