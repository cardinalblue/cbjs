import * as React from "react";
import {ReactNode, useEffect, useState} from "react";
import {Queue} from "../util";
import {BehaviorSubject, Observable} from "rxjs";
import {Rect, Size} from "../kor"
import {ResizeObserver} from "resize-observer"
import {domBoundingClientRect} from "../touch"


// ----------------------------------------------------------------
// Custom React Hooks to help with RxJS

export function useObservable<T>(initial: T,
                                 source: Observable<T>,
                                 inputs: React.DependencyList = [source])
  : T
{
  const [t, setT] = React.useState(initial)

  // ---- Make sure value gets set if source is different
  //      (see https://learnwithparam.com/blog/how-to-pass-props-to-state-properly-in-react-hooks/)
  React.useEffect(
    () => setT(initial),
    [source])

  // ---- Subscribe for next values in Observable
  React.useEffect(() => {
    const subs = source.subscribe((t: T) => {
      if (useObservable.debug)
        console.debug("---- useObservable", t)
      setT(t)
    })
    return () => subs.unsubscribe()
  }, inputs)

  return t
}
useObservable.debug = false

// ---- Same as useObservable except that it allows an operator for the source
//      to be piped thru.
//      Note that this assumes that the operator function will be *constant*
//      and there is no dependencies on it.
//      If the operator function needs to be varied, then pipe the source
//      and memoize it with the correct dependencies.
//
export function usePiped<T1, T2=T1>(initial: T2,
                                    source: Observable<T1>,
                                    operator: (source: Observable<T1>) => Observable<T2>)
  : T2
{
  const [t, setT] = useState(initial)
  useEffect(() => {
    const sub = source
      .pipe(operator)
      .subscribe(t2 => {
        if (usePiped.debug)
          console.debug("---- usePiped", t)
        setT(t2) }
      )
    return () => sub.unsubscribe()
  }, [source])    // We purposefully don't make the operator a dependency, see above
  return t

}
usePiped.debug = false

export function useBehaviorSubject<T>(subject: BehaviorSubject<T>,    debugF?: (t: T) => any) : T;
export function useBehaviorSubject<T>(subject: T,                     debugF?: (t: T) => any) : T;
export function useBehaviorSubject<T>(subject: BehaviorSubject<T>|T,  debugF?: (t: T) => any) : T;
export function useBehaviorSubject<T>(subject: BehaviorSubject<T>|T,  debugF?: (t: T) => any) : T
{
  // React hook always has to call `useState`, even if not passed a BehaviorSubject
  let [t, setT] = React.useState(
    subject instanceof BehaviorSubject ?
      subject.value : subject
  )

  // Non Behavior Subject case
  if (!(subject instanceof BehaviorSubject)) {
    [t, setT] = [subject, (_) => {
    }]
  }

  // React hook always has to call `useEffect`, even if not passed a BehaviorSubject
  React.useEffect(() => {
    if (subject instanceof BehaviorSubject) {
      const subs = subject.subscribe((tNew: T) => {
        if (debugF) debugF(tNew)
        setT(tNew)
      })
      return () => subs.unsubscribe()
    }
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
        console.debug("---- useObserving", t)
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

export function useResizeObserver(ref: React.RefObject<any>, f: (size: Size) => any)
{
  React.useEffect(() => {
    const e = ref.current
    if (e) {
      const ro = new ResizeObserver(
        entries =>
          entries.forEach(entry => {
            f(new Size(
              entry.contentRect.width,
              entry.contentRect.height
            ))
          })
      )
      ro.observe(e)
      return () => ro.unobserve(e)
    }
  }, [ref, f])
}

// ---- Use state to remember whether we were mounted before or
//      is a rerender
export function useIsMounting() {
  const [isMounting, setIsMounting] = useState(true)
  useEffect(() => setIsMounting(false), [])
  return isMounting
}

export function StopPropagation(props: {
  events?: ("MouseDown"|"MouseMove"|"MouseUp"|"TouchCancel"|"TouchEnd"|"TouchMove"|"TouchStart")[],
  children: React.ReactNode|React.ReactNodeArray })
{
  const allEvents = [
    "MouseDown",
    "MouseMove",
    "MouseUp",
    "TouchCancel",
    "TouchEnd",
    "TouchMove",
    "TouchStart"
  ]
  const handlersArr = (props.events || allEvents).map( // TODO: ES2019 syntax won't work with bit
    e => [ "on" + e, (e: Event) => e.stopPropagation() ])
  const handlers: any = {}
  handlersArr.forEach(([s, f]) => {
    handlers[s as string] = f
  })

  return (
    <div {...handlers} className="StopPropagation">
      {props.children}
    </div>
  )
}

export function OptionallyParent(props: {
  children: React.ReactNode|React.ReactNodeArray,
  parent: ((children: React.ReactNode|React.ReactNodeArray) => React.ReactNode)|null|undefined|false,
})
  : React.ReactNode|React.ReactNodeArray
{
  const { children, parent } = props
  const parentActual = parent && parent(children)
  if (!parentActual)
    return children
  // else
  return parentActual
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class DebuggerErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    debugger
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    debugger
  }

  public render() {
    if (this.state.hasError) {
      return <h1>Sorry.. there was an error</h1>;
    }

    return this.props.children;
  }
}
