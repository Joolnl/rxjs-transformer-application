import { Component } from '@angular/core';
import { fromEvent, interval, range, of } from 'rxjs';
import { map, merge, scan } from 'rxjs/operators';



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
    const test2 = of(1);
    test.subscribe(i => console.log(i));
    test2.subscribe(i => console.log(i));
  }


  // Make two streams from both buttons, map add to 1 substract to -1, merge and scan.
  ngAfterViewInit() {
    const add = fromEvent(document.getElementById('addButton'), 'click');
    const substract = fromEvent(document.getElementById('minusButton'), 'click');

    add.pipe(
      map(evt => 1),                          // map events from add to 1.
      merge(substract.pipe(map(evt => -1))),  // map events from substract to -1 and merge with add stream.
      scan((acc, curr) => acc += curr)        // accumulate values.
    ).subscribe(i => this.counter = i);
  }

}
