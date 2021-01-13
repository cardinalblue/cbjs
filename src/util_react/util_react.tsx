import * as React from "react";
import {Queue} from "../util";
import {BehaviorSubject, Observable} from "rxjs";
import {Rect, Size} from "../kor"
import {ResizeObserver} from "resize-observer"
import {domBoundingClientRect} from "../touch"


// ----------------------------------------------------------------
// Custom React Hooks to help with RxJS

export function useObservable<T>(observable: Observable<T>,
                                 defaultValue: T,
                                 inputs: React.DependencyList = [observable])
  : T {
  const [t, setT] = React.useState(defaultValue)

  React.useEffect(() => {
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

export function useBehaviorSubject<T>(subject: BehaviorSubject<T>,    debugF?: (t: T) => any) : T;
export function useBehaviorSubject<T>(subject: T,                     debugF?: (t: T) => any) : T;
export function useBehaviorSubject<T>(subject: BehaviorSubject<T>|T,  debugF?: (t: T) => any)
  : T
{
  // React hook always have to call `useState`, even if not passed a BehaviorSubject
  const [t, setT] = React.useState(subject instanceof BehaviorSubject ?
    subject.value : subject
  )

  // Default case of no BehaviorSubject given
  if (!(subject instanceof BehaviorSubject))
    return t

  React.useEffect(() => {
    const subs = subject.subscribe((tNew: T) => {
      if (debugF) debugF(tNew)
      setT(tNew)
    })
    return () => subs.unsubscribe()
  }, [subject])

  return t
}

export function useObserving<T>(observable: Observable<T>,
                                callback: (value: T) => void,
                                inputs: React.DependencyList = [observable])
  : void {
  React.useEffect(() => {
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

export function useFocusing(ref: React.MutableRefObject<HTMLElement | null>, doFocus: Queue<boolean>) {
  React.useEffect(() => {
    return doFocus.subscribe(focus =>
      ref.current &&
      (focus ?
          ref.current.focus() :
          ref.current.blur()
      )
    )
  })
}

// -----------------------------------------------------------------------

export function useResize(element: React.RefObject<Element>|Element|Window|null,
                          callback: (size: Size) => void)
{
  React.useEffect(() => {

    let e = element as any
    if (e && e.current !== undefined)
      e = e.current

    const listener = () => {
      if (e !== null && e !== undefined) {
        const size =
          (e.innerWidth  !== undefined) ? new Size(e.innerWidth, e.innerHeight) :
            (e.clientWidth !== undefined) ? new Size(e.clientWidth, e.clientHeight) :
              null
        size && callback(size)
      }
    }

    // Call initially and listen for further updates
    listener()
    const obs = new ResizeObserver(entries => listener())
    const dom =
      (e === null) ? null :
        (e.innerWidth !== undefined)  ? e.window.body :
          (e.clientWidth !== undefined) ? e :
            null
    dom && obs.observe(dom)

    // Cleanup
    return () => ((dom && obs.unobserve(dom)))
  })
}

export function useBoundingClientRect(element: React.RefObject<Element>|Element|Window|null,
                                      callback: (rect: Rect) => void)
{
  React.useEffect(() => {

    let e = element as any
    if (e && e.current !== undefined)
      e = e.current

    const listener = () => {
      if (e !== null && e !== undefined) {
        const rect = domBoundingClientRect(e)
        rect && callback(rect)
      }
    }

    // Call initially and listen for further updates
    listener()
    const obs = new ResizeObserver(entries => listener())
    const dom =
      (e === null) ? null :
        (e.innerWidth !== undefined)  ? e.window.body :
          (e.clientWidth !== undefined) ? e :
            null
    dom && obs.observe(dom)

    // Cleanup
    return () => ((dom && obs.unobserve(dom)))
  })
}

export function useUpload(f: (files: File[]) => any): [React.ReactElement, () => any] {

  const ref = React.useRef<HTMLInputElement|null>(null)

  function filesSelected(fileList: FileList) {
    console.log("++++ UploadView onFiles", fileList)
    const fileArray = []
    for (let i=0; i < fileList.length; i++)
      fileArray[i] = fileList[i]
    f(fileArray)
  }

  return ([
    <input
      type={"file"}
      style={{display: "none"}}
      ref={ref}
      onChange={e => e.target && e.target.files && filesSelected(e.target.files)}
    />,
    () => ref.current?.click()
  ])

}
