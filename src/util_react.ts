import {DependencyList, MutableRefObject, useEffect, useState} from "react";
import {Queue} from "./util";
import {BehaviorSubject, Observable} from "rxjs";


// ----------------------------------------------------------------
// Custom React Hooks to help with RxJS

export function useObservable<T>(observable: Observable<T>,
                                 defaultValue: T,
                                 inputs: DependencyList = [observable])
  : T {
  const [t, setT] = useState(defaultValue)

  useEffect(() => {
    const subs = observable.subscribe((t: T) => {
      if (useObservable.debug)
        console.log("---- useObservable", t)
      setT(t)
    })
    return () => subs.unsubscribe()
  }, inputs)

  return t
}
useObservable.debug = false

export function useBehaviorSubject<T>(subject: BehaviorSubject<T>) : T;
export function useBehaviorSubject<T>(subject: T) : T;
export function useBehaviorSubject<T,DEFAULT>(subject: BehaviorSubject<T>|DEFAULT)
  : T|DEFAULT
{
  // React hook always have to call `useState`, even if not passed a BehaviorSubject
  const [t, setT] = useState(subject instanceof BehaviorSubject ?
    subject.value : subject
  )

  // Default case of no BehaviorSubject given
  if (!(subject instanceof BehaviorSubject))
    return t

  useEffect(() => {
    const subs = subject.subscribe((tNew: T) => {
      if (useBehaviorSubject.debug)
        console.log("---- useBehaviorSubject", t, tNew)
      setT(tNew)
    })
    return () => subs.unsubscribe()
  }, [subject])

  return t
}
useBehaviorSubject.debug = false

export function useObserving<T>(observable: Observable<T>,
                                callback: (value: T) => void,
                                inputs: DependencyList = [observable])
  : void {
  useEffect(() => {
    const subs = observable.subscribe(t => {
      if (useObserving.debug)
        console.log("---- useObserving", t)
      callback(t)
    })
    return () => subs.unsubscribe()
  }, [observable])
}
useObserving.debug = false

// -----------------------------------------------------------------------
// Focuses the given element whenever a `true` gets sent on the given Queue.
// Blurs if `false` is sent.

export function useFocusing(ref: MutableRefObject<HTMLElement | null>, doFocus: Queue<boolean>) {
  useEffect(() => {
    return doFocus.subscribe(focus =>
      ref.current &&
      (focus ?
          ref.current.focus() :
          ref.current.blur()
      )
    )
  })
}