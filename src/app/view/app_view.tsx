import * as React from "react"
import {BehaviorSubject, fromEvent} from "rxjs"

export function useAppPath(path$: BehaviorSubject<string|null>) {

  // ---- Update browser's history with path
  React.useEffect(() => {
    const subs = path$.subscribe(path => {
      console.log("++++ AppView render path$", path)
      if (window.location.pathname !== path)
        window.history.pushState({}, "Cardee", path)
    })
    return () => subs.unsubscribe()
  });

  // ----- Update path from browser's location
  React.useEffect(() => {
    const subs = fromEvent(window, "popstate").subscribe(e => {
      console.log("++++ AppView render popstate event", e)
      path$.next(window.location.pathname)
    })
    return () => subs.unsubscribe()
  });


}