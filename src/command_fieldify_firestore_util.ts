import {deleteField, FieldValue} from "firebase/firestore"
import {Functionable} from "./command_fieldify_util"

export function fieldifyFirestoreDeletable<N extends string, V>(name: N, value: Functionable<V | undefined | null>)
  : { [key in N]?: V | FieldValue } {
  if (typeof value === 'function')
    value = (value as () => V | undefined | null)()
  return value === undefined ?
    {} : {
      // Strangely we need the `any` here to get past compiler
      [name as any]:
        value === null ?
          deleteField() : value
    }
}