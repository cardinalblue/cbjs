import {defer, Observable} from "rxjs";
import {firebaseLogout$} from "../../firebase_login"


export function manipulateLogout(): Observable<unknown> {
  console.log('++++ manipulateLogout')
  return defer(() => firebaseLogout$())
}
