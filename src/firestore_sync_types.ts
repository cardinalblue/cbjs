import {BehaviorSubject, Subject} from "rxjs"
import * as _ from "lodash"
import {BLANK} from "./util";

export function fieldToStringNullable(field: any): string|null {
  if (typeof field == "string")
    return field
  return null
}
export function fieldToString(field: any, _default: string = BLANK): string {
  if (typeof field == "string")
    return field
  return _default
}
export function fieldUpdate<T>(value: T, to: BehaviorSubject<T>) {
  if (!_.isEqual(value, to.value)) {
    to.next(value)
  }
}