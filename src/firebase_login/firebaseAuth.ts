import {browserLocalPersistence, getAuth, setPersistence, signOut, User,} from "firebase/auth";
import * as firebaseui from "firebaseui";
import {GoogleAuthProvider, EmailAuthProvider} from "firebase/auth"

import {Observable} from "rxjs";
import {promise$} from "../util_rx"

let firebaseAuthUI: firebaseui.auth.AuthUI|null = null

export function firebaseAuthConfigure$()
{
  return promise$(() =>
    setPersistence(getAuth(), browserLocalPersistence)
  )
}

export function firebaseCurrentUser$(): Observable<User|null>
{
  const auth = getAuth()

  return new Observable(subscriber => {
    subscriber.next(auth.currentUser)
    const subs = auth.onAuthStateChanged(
      user => subscriber.next(user),
      error => subscriber.error(error)
      )
    return () => {
      subs()
    }
  })
}

export function firebaseLogout$() {
  return promise$(() => signOut(getAuth()))
}

export function firebaseLoginStart$(element: string|Element)
{
  return new Observable<User>(subscriber => {

    console.log("++++ firebaseLoginStart$")

    const config: firebaseui.auth.Config = {

      // ---- Sign in
      signInSuccessUrl: "/",
      signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        GoogleAuthProvider.PROVIDER_ID,
        EmailAuthProvider.PROVIDER_ID,
      ],
      signInFlow: "popup",

      // ---- Policy and TOS
      // tosUrl and privacyPolicyUrl accept either url string or a callback
      // function.
      // Terms of service url/callback.
      tosUrl: "<your-tos-url>",
      // Privacy policy url/callback.
      privacyPolicyUrl: function () {
        window.location.assign("<your-privacy-policy-url>");
      },

      // ---- Callbacks
      callbacks: {
        signInSuccessWithAuthResult(authResult: any, redirectUrl?: string) {
          const user = authResult.user
          console.log("++++ firebaseAuth signInSuccessWithAuthResult", user, authResult)
          subscriber.next(user)
          subscriber.complete()
          return false
        },
        signInFailure(error: firebaseui.auth.AuthUIError): Promise<void> {
          subscriber.error(error)
          return new Promise<void>((resolve, reject) => {})
        }

      },
    };

    // The start method will wait until the DOM is loaded.
    firebaseAuthUI = firebaseAuthUI || new firebaseui.auth.AuthUI(getAuth())
    firebaseAuthUI.start(element, config);

    return () => {
      firebaseAuthUI && firebaseAuthUI.reset()
    }
  })
}


