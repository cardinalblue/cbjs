import {Observable, ReplaySubject, Subject} from "rxjs"
import {MutableRefObject, RefObject} from "react"

type InputStreamerInput = string | RefObject<HTMLElement> | HTMLElement

function extractInput(input: InputStreamerInput): string | null {
  const current = (input as MutableRefObject<HTMLElement>).current
  if (current instanceof HTMLElement) input = current
  if (input instanceof HTMLElement) input = input.innerText
  if (typeof input === "string") return input
  return null
}

export class InputStreamer {

  // ---- Output
  readonly stream$ = new Subject<Observable<string>>()

  // ---- Public interface
  onStart() {
    this.start$()
  }

  onInput(input: InputStreamerInput) {
    const i = extractInput(input)
    if (i !== null)
      this.start$().next(i)
  }

  onStop() {
    if (this.cur$) this.cur$.complete()
    this.cur$ = null
  }

  onSpecialKey(input: InputStreamerInput, key: string): boolean {
    const i = extractInput(input)
    if (key === 'Enter') {
      this.onInput((i || "") + '\0')
      return true
    } else if (key === 'Tab') {
      this.onInput((i || "") + '\t')
      return true
    }
    return false
  }

  private cur$: Subject<string> | null = null

  private start$(): Subject<string> {
    if (this.cur$ === null) {
      this.cur$ = new ReplaySubject<string>()
      this.stream$.next(this.cur$)
    }
    return this.cur$
  }

}