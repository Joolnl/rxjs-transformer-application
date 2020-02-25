import { Component } from '@angular/core';
import { fromEvent, interval, range, of, pipe } from 'rxjs';
import { map, merge, scan, tap, filter } from 'rxjs/operators';



@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.sass']
})
export class CounterComponent {
  protected counter: number = 0;

  constructor() {
    const secondsCounter = interval(1000);
    const secondsCounter2 = interval(1000);
    const test = range(1, 10);
    const b = range(1, 12);
    const test2 = of(1);

    const test3 = of(107107).pipe(
      map(x => x)
    ).subscribe(x => console.log(x));

    // TODO: the arrowfunction as an argument causes an error.
    const test5 = of(207207).pipe(
      map(x => 307307),
      map(x => 407407)
    ).subscribe(x => console.log(x));

    const test6 = of(777).pipe(
      filter(x => x > 1)
    ).subscribe(x => console.log(x));

    // test.subscribe(i => console.log(i));
    // test2.subscribe(i => console.log(`called ${i}`));
  }

  // Make two streams from both buttons, map add to 1 substract to -1, merge and scan.
  ngAfterViewInit() {
    const add = fromEvent(document.getElementById('addButton'), 'click');
    const substract = fromEvent(document.getElementById('minusButton'), 'click');

    add.pipe(
      tap(null),
      map(evt => 1),                          // map events from add to 1.
      merge(substract.pipe(map(evt => -1))),  // map events from substract to -1 and merge with add stream.
      scan((acc, curr) => acc += curr)        // accumulate values.
    ).subscribe(i => this.counter = i);

    const a = interval(1000);
    a.pipe(
      map(x => x = 1),
      tap(x => console.log(x)),
      filter(x => x > 2),
      tap(x => console.log('asdasdasd'))
    );
  }

}
