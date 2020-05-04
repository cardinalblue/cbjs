import '../setup_test'
import {testScheduler} from "../setup_test"
import {windowToggle,} from "rxjs/operators";
import {Observable} from "rxjs";

it('windowToggle works', () => {
  const scheduler = testScheduler()
  scheduler.run(helpers => {
    const {cold, expectObservable: ex} = helpers

    const data$  = cold('-----a----b---c------d----e-f---g--h---i--|')
    const on$    = cold('---a--------------b------------c----------|')
    const off$: Record<string, Observable<any>> = {
      a: cold(             '-------------a'),
      b: cold(                            '-----------b'),
      c: cold(                                         '----------c'),
    }
    const output$ =     '---a--------------b------------c----------|'
    const outputs  = {
      a: cold(             '--a----b---c-|'),
      b: cold(                            '---d----e-f|'),
      c: cold(                                         '-g--h---i-|'),
    }
    ex(data$.pipe(windowToggle(on$, i => off$[i])))
      .toBe(output$, outputs)

  })
})