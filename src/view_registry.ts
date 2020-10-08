// ------------------------------------------------------------
// TypeRegistry
//
import React, {ReactElement, useContext} from "react";

export type Newable<T> = { new (...args: any[]): T; }

export class TypeRegistry<T,V> extends Array<[ Newable<T>, (t: T) => V ]> {
  constructor() {
    super();
  }
  register<TSUB extends T>(n: Newable<TSUB>, factory: (t: TSUB) => V) {
    this.push([
      n,
      factory as (t: T) => V    // Force TypeScript because we manually
                                // typecheck before we call the factoriy
    ])
  }
  produce(k: T): V|undefined {
    const [ t, factory ] = this.find(([ t, factory ]) => k instanceof t) ||
    [undefined, undefined]
    return factory?.(k)
  }
}

// ------------------------------------------------------------
// ViewRegistry use hooks
//
const ViewRegistryContext = React.createContext(new TypeRegistry<object, ReactElement>())

export function ViewRegistryProvider(props: {
  registry: TypeRegistry<object, ReactElement>,
  children: ReactElement|(ReactElement[])
})
{
  return (
    <ViewRegistryContext.Provider value={props.registry}>
      { props.children }
    </ViewRegistryContext.Provider>
  )
}
export function useViewRegistry(): TypeRegistry<object, ReactElement> {
  return useContext(ViewRegistryContext)
}
export function useViewFor(k: object|null|undefined): ReactElement|undefined
{
  const registry = useContext(ViewRegistryContext)
  if (!k) return undefined
  return registry.produce(k)
}
