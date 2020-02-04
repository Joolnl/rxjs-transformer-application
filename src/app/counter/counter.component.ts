import { Component, OnInit, ViewChild } from '@angular/core';
import { interval, fromEvent } from 'rxjs';
import { merge, map, scan } from 'rxjs/operators';
// import { wrapFromEvent } from '../../../rxjs_wrapper';



@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.sass']
})
export class CounterComponent implements OnInit {
  protected counter: number = 0;

  constructor() {
    console.log('TESTSTRING');
    const a = 'TESTSTRING';
    console.log(a);

    const secondsCounter = interval(1000);
    // secondsCounter.subscribe(n => console.log(n));
  }

  ngOnInit() {

  }

  // wrapFromEvent = () => {

  // };

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
