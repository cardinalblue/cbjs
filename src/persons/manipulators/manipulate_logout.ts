import {defer, Observable} from "rxjs";
import {firebaseLogout$} from "@piccollage/cbjs";


export function manipulateLogout(): Observable<unknown> {
  console.log('++++ manipulateLogout')
  return defer(() => firebaseLogout$())
}
