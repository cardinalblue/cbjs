import * as React from "react";
import {CSSProperties, ReactPortal, useContext, useEffect, useRef} from "react";
import {BehaviorSubject} from "rxjs";
import ReactDOM from "react-dom"
import {useBehaviorSubject} from "./util_react"


class MapDefault<K,V> extends Map<K,V> {
  constructor(readonly defaulter: (k: K) => V) { super() }

  static EMPTY() {
    return new MapDefault<string, BehaviorSubject<HTMLElement|null>>(
      _ => new BehaviorSubject<HTMLElement | null>(null)
    )
  }

  get(k: K): V {
    let v = super.get(k)
    if (!v) {
      v = this.defaulter(k)
      this.set(k, v)
    }
    return v
  }
}

const PortalContext = React.createContext(MapDefault.EMPTY())

export function PortalProvider(props: {children: React.ReactElement|React.ReactElement[]}) {
  return (
    <PortalContext.Provider value={ MapDefault.EMPTY() }>
      { props.children }
    </PortalContext.Provider>
  )
}

export function PortalOutlet(props: { id: string,
                                      className?: string,
                                      style?: CSSProperties }) {
  const ref = useRef(null)
  const map = useContext(PortalContext)
  useEffect(() => {
    const bs$ = map.get(props.id)
    bs$.next(ref.current)
  })
  return (<div id={`Portal_${props.id}`}
               ref={ref}
               className={ props.className }
               style={ props.style }
               />)
}

export function PortalContent(props: { id: string,
                                       children: React.ReactElement|React.ReactElement[] })
  : ReactPortal|null
{
  const map = useContext(PortalContext)
  const outlet = useBehaviorSubject(map.get(props.id))

  return outlet && ReactDOM.createPortal(
    props.children,
    outlet
  );
}

