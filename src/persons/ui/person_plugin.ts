import {BehaviorSubject, of} from "rxjs";
import {Person} from "../models/person";
import {firebaseUserToPersonMapper} from "..";
import {mergeMap} from "rxjs/operators";
import {log$, taplog} from "../../util_rx"
import {firebaseCurrentUser$, LoginWidget} from "../../firebase_login"
import {Domainer} from "../../domainer"
import {Context} from "../../contexter"

export class PersonPlugin extends Domainer implements Context {

  currentPerson$ = new BehaviorSubject<Person|null>(null)
  loginWidget$ = new BehaviorSubject<LoginWidget | null>(null)

  constructor() {
    super()
    this.connectPerson()
  }

  connectPerson() {

    // ---- Connect firebase user to currentPerson$
    const personMapper = firebaseUserToPersonMapper();
    this.connecting(
      firebaseCurrentUser$().pipe(
        log$('++++ firebaseCurrentUser$'),
        mergeMap(user => (user ? personMapper(user) : of(null))),
        taplog('++++ currentPerson$')
      ),
      this.currentPerson$
    )
  }

}
