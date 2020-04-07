import * as React from "react"
import {createRef, RefObject, useContext, useEffect, useRef, useState} from "react"

export class RefStore<K, R> {
  constructor() {
    console.log("++++ RefStore constructor")
  }

  _stored: Array<{ref: RefObject<R>, key: K}> = []
  insert(key: K, ref: RefObject<R>) {
    const i = this.stored.findIndex(j => j.key === key)
    if (i < 0) {  this.stored.push({ ref, key }); }
    else {        this.stored[i] = { ref, key };  }
  }
  remove(key: K) {
    const i = this.stored.findIndex(j => j.key === key)
    if (i >= 0) {
      this.stored.splice(i, 1)
    }
  }
  get(key: K) {
    const i = this.stored.findIndex(j => j.key === key)
    if (i >= 0)
      return this._stored[i].ref
    return null
  }
  current(key: K) {
    const ref = this.get(key)
    if (ref) return ref.current
    return null
  }

  get stored() { return this._stored; }
}

// ------------------------------------------------------------
// React Context and Hook integration

export const RefStoreContext = React.createContext(new RefStore())

// Use this to record React ref associated with an object (e.g. a Widget).
// It gets passed via a React Context to children widget.
//
export function useNewRefStore<K,R>() {
  const [refStore] = useState(new RefStore<K,R>())
  return refStore
}

// Can pass `null` as the key, in which case the ref will not be stored.
export function useRefStore<K, R>(key: K|null, _refStore: RefStore<K,R>|null = null)
  : RefObject<R>
{
  // Use the RefStore given or the one in the Context if not given
  const refStoreContext = useContext(RefStoreContext) as RefStore<K,R>
  const refStore = _refStore || refStoreContext

  const ref = useRef() as RefObject<R>
  useEffect(() => {
    if (key) {
      refStore.insert(key, ref)
      return () => refStore.remove(key)
    }
  })
  return ref
}

// Can pass `null` as the key, in which case the ref will not be stored.
export function useRefStores<K, R>(keys: Array<K>, _refStore: RefStore<K,R>|null = null)
  : Map<K, RefObject<R>>
{
  // Use the RefStore given or the one in the Context if not given
  const refStoreContext = useContext(RefStoreContext) as RefStore<K,R>
  const refStore = _refStore || refStoreContext

  const refs: Array<[K, RefObject<R>]> = keys.map(k => [k, createRef()])
  useEffect(() => {
    refs.forEach( ([ key, ref ]) => {
      if (key && ref) {
        refStore.insert(key, ref)
        return () => refStore.remove(key)
      }
    })
  })
  return new Map(refs)
}


