import {combineLatest, Observable, of} from "rxjs";
import {catchError, first, map, shareReplay} from "rxjs/operators";
import {ID, Person} from "../models/person";
import firebase from "firebase/app";
import {commandCreatePerson} from "..";
import {cachedMapper, DocRef, DocSnap, fieldToString, firestoreSyncDocument} from "@piccollage/cbjs";

export type User = firebase.User;

// -----------------------------------------------------------------------------
// Reference shortcuts

export function firestorePersons() {
  return firebase.firestore().collection('persons')
}


// -----------------------------------------------------------------------------
// Mappers

export const PersonMapper: (personId: ID) => Observable<Person> =
  cachedMapper((personId: ID) => personId,
    (personId: ID) =>
      syncedPerson$(firestorePersons().doc(personId))
  )


export function firebaseUserToPersonMapper()
  : (user: User) => Observable<Person> {
  return ((user: User) => {
    const personId = `f:${user.uid}`
    const person$ = PersonMapper(personId)
    return person$.pipe(
      catchError(error => {
        console.error("++++ PersonMapper failed", error)
        return commandCreatePerson(personId, user.displayName, user.photoURL).execution()
      })
    )
  })
}


// -----------------------------------------------------------------------------

export function syncedPerson$(ref: DocRef) {

  console.log("++++ syncedPerson$", ref)

  return firestoreSyncDocument(ref).pipe(
    // ---- Extract data
    map((snap: DocSnap) => {
      const data = snap.data() || {}
      console.log("++++ syncedPerson$ data", data)

      const name = fieldToString(data.name, undefined) || null
      const imageUrl = fieldToString(data.imageUrl, undefined) || null

      return {snap, name, imageUrl}
    }),

    // ---- Create a model from the first set of data and recombine
    source => {
      source = source.pipe(shareReplay({ bufferSize: 1, refCount: true}))
      return source.pipe(
        first(),
        map(({snap, name, imageUrl}) => {
          const model = new Person(snap.id, name, imageUrl)

          model.updating(
            source.pipe(map(_ => _.name)),
            model.displayName$
          )
          model.updating(
            source.pipe(map(_ => _.imageUrl)),
            model.imageUrl$
          )

          return model
        })
      )
    },
    // ---- Share (otherwise different invocations return different instances)
    shareReplay({ bufferSize: 1, refCount: true}),
      // Need a `shareReplay` so that it doesn't reconnect and
      // we can always get the last model when we have the Observable
  )
}

export function syncedPersons$(personIds: ID[])
  : Observable<Person[]> {
  const personIds$ = personIds.map(PersonMapper)
  return personIds$.length > 0 ? combineLatest(personIds$) : of([])
}


