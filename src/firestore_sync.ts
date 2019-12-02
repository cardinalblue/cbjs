import {Observable, Subscriber} from "rxjs"

import * as firebase from "firebase"

export type QuerySnap     = firebase.firestore.QuerySnapshot
export type DocSnap       = firebase.firestore.DocumentSnapshot
export type DocRef        = firebase.firestore.DocumentReference
export type CollectionRef = firebase.firestore.CollectionReference
export type Query         = firebase.firestore.Query

export function firestoreSyncDocument(docRef: DocRef)
  : Observable<DocSnap>
{
  return new Observable((subs: Subscriber<DocSnap>) =>
    // `onSnapshot` already returns a function that ends the subscription
    docRef.onSnapshot(
      snap => subs.next(snap),
      (error: Error) => subs.error(error),
      () => subs.complete()
    )
  )
}

export function firestoreSyncCollectionArray(ref: CollectionRef|Query)
  : Observable<Array<DocSnap>>
{
  return new Observable((subs: Subscriber<Array<DocSnap>>) =>
    // `onSnapshot` already returns a function that ends the subscription
    ref.onSnapshot(
      { includeMetadataChanges: false },
      (querySnap: QuerySnap) => {
        subs.next(querySnap.docs)
      },
      (error: Error) => subs.error(error),
      () => subs.complete()
    )
  )
}

