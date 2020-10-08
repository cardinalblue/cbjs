import * as React from "react";

// ------------------------------------------------------------
// TypeRegistry
//

export type Newable<T> = { new (...args: any[]): T; }

export class TypeRegistry<T,V> extends Array<[ Newable<T>, (ta: T) => V ]> {
  constructor() {
    super();
  }
  register<TSUB extends T>(n: Newable<TSUB>, factory: (t: TSUB) => V) {
    this.push([
      n,
      factory as (t: T) => V    // Force TypeScript because we manually
                                // typecheck before we call the factory
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
const ViewRegistryContext = React.createContext(new TypeRegistry<object, React.ReactElement>())

export const ViewRegistryProvider = React.memo((props: {
  registry: TypeRegistry<object, React.ReactElement>,
  children: React.ReactElement|(React.ReactElement[])
}) =>
{

  return (
    <ViewRegistryContext.Provider value={props.registry}>
      { props.children }
    </ViewRegistryContext.Provider>
  )
})
export function useViewRegistry(): TypeRegistry<object, React.ReactElement> {
  return React.useContext(ViewRegistryContext)
}
export function useViewFor(k: object|null|undefined): React.ReactElement|undefined
{
  const registry = React.useContext(ViewRegistryContext)
  if (!k) return undefined
  return registry.produce(k)
}
