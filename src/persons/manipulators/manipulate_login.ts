import firebase from "firebase/app";
import {defer, Observable} from 'rxjs'
import {finalize, takeUntil} from 'rxjs/operators'
import {PersonPlugin} from "../ui/person_plugin"
import {firebaseCurrentUser$, LoginWidget} from "../../firebase_login"
import {filterDefined, taplog} from "../../util_rx"

export function manipulateLogin(personPlugin: PersonPlugin)
  : Observable<firebase.User>
{

  return defer(() => {
    console.log("++++ manipulate login")

    // ---- Create the login widget
    const loginWidget = new LoginWidget()
    personPlugin.loginWidget$.next(loginWidget)

    // ---- Take until we have a user
    const currentUser$ = firebaseCurrentUser$().pipe(
      filterDefined()
    )

    return loginWidget.loginRequest.firebaseUser$.pipe(
      taplog("++++ manipulate login firebaseUser$"),
      // ---- Remove if for some external reason or we already have a user
      takeUntil(currentUser$),
      // ---- Remove the loginWidget when done
      finalize(() => personPlugin.loginWidget$.next(null))
    )
  })
}

