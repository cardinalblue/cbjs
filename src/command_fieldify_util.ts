import {Color} from "./color"

export type Functionable<T> = T | (() => T)

export function fieldify<N extends string, V>(name: N, value: Functionable<V | undefined>)
  : { [key in N]?: V } {
  if (typeof value === 'function')
    value = (value as () => V | undefined)()
  return value === undefined ?
    {} : {
      // Strangely we need the `any` here to get past compiler
      [name as any]: value
    }
}

export function fieldifyIf<SIGNAL, V>(signal: SIGNAL, v: V): V | {} {
  return signal ? v : {}
}
export function fieldifyIfDefined<SIGNAL, V>(signal: SIGNAL, v: V): V | {} {
  return signal !== undefined ? v : {}
}

export function fieldifyColor<N extends string>(name: N,
                                                color: Color | null | undefined) {
  if (!color) return {}
  return {
    [name as string]: color.code
  }
}