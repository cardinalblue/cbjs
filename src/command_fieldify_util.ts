import firebase from "firebase/app";
import {Color} from "./color"

export function fieldify<N extends string, V>(name: N,
                                              value: V | undefined | (() => V | undefined))
  : { [key in N]?: V } {
  if (typeof value === 'function')
    value = (value as () => V | undefined)()
  return value === undefined ?
    {} : {
      // Strangely we need the `any` here to get past compiler
      [name as any]: value
    }
}

export function fieldifyDeletable<N extends string, V>(name: N,
                                                       value: V | undefined | null | (() => V | undefined | null))
  : { [key in N]?: V | firebase.firestore.FieldValue } {
  if (typeof value === 'function')
    value = (value as () => V | undefined | null)()
  return value === undefined ?
    {} : {
      // Strangely we need the `any` here to get past compiler
      [name as any]:
        value === null ?
          firebase.firestore.FieldValue.delete() : value
    }
}

export function fieldifyIf<SIGNAL, V>(signal: SIGNAL, v: V): V | {} {
  return signal ? v : {}
}

export function fieldifyColor<N extends string>(name: N,
                                                color: Color | null | undefined) {
  if (!color) return {}
  return {
    [name as string]: color.code
  }
}