import {BehaviorSubject, of} from "rxjs";
import {Person} from "../models/person";
import {Context, Domainer, firebaseCurrentUser$, log$, LoginWidget, taplog} from "@piccollage/cbjs";
import {firebaseUserToPersonMapper} from "..";
import {mergeMap} from "rxjs/operators";

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
