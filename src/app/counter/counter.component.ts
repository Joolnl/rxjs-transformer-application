import { Component } from '@angular/core';
import { fromEvent, interval, range, of } from 'rxjs';
import { map, merge, scan, tap, filter } from 'rxjs/operators';



@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.sass']
})
export class CounterComponent {
  protected counter: number = 0;

  constructor() {

    // const testIntervalBeta = interval(500);

    // testIntervalBeta.pipe(
    //   filter(() => false)
    // );
  }

  // Make two streams from both buttons, map add to 1 substract to -1, merge and scan.
  ngAfterViewInit() {
    const add = fromEvent(document.getElementById('addButton'), 'click');
    const substract = fromEvent(document.getElementById('minusButton'), 'click');
    const testIntervalAlfa = interval(1000);

    of(1).subscribe();
    of(2).pipe(map(() => 7)).subscribe();
    of(1).pipe().subscribe();

    const piped = testIntervalAlfa.pipe(
      map(x => x = 1),
      tap(x => console.log(x)),
      filter(x => x > 2),
      tap(x => console.log('asdasdasda')),
      tap(() => console.log('test'))
    );

    // piped.subscribe(x => console.log(x));

    add.pipe(
      tap(null),
      map(() => 1),                          // map events from add to 1.
      merge(substract.pipe(map(() => -1))),  // map events from substract to -1 and merge with add stream.
      scan((acc, curr) => acc += curr)        // accumulate values.
    ).subscribe(i => this.counter = i);

  }

}
