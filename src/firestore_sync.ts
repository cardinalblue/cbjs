import {forkJoin, from, Observable, Subscriber} from "rxjs"
import {mergeMap} from "rxjs/operators";

import * as firebase from "firebase/app"
import {promise$} from "./util_rx";

export type QuerySnap           = firebase.firestore.QuerySnapshot
export type DocSnap             = firebase.firestore.DocumentSnapshot
export type DocRef              = firebase.firestore.DocumentReference
export type CollectionRef       = firebase.firestore.CollectionReference
export type Query               = firebase.firestore.Query
export type UploadTaskSnapshot  = firebase.storage.UploadTaskSnapshot

export function firestoreSyncDocument(docRef: DocRef)
  : Observable<DocSnap>
{
  return new Observable((subs: Subscriber<DocSnap>) =>
    // `onSnapshot` already returns a function that ends the subscription
    docRef.onSnapshot(
      snap => snap.exists ?
        subs.next(snap) :
        subs.error(`firestoreSyncDocument error, doesn't exist ${ docRef.path}`),
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

export function firestoreDeleteCollection(collectionRef: CollectionRef)
  : Observable<void[]>
{
  return promise$(() => collectionRef.get())
    .pipe(
      mergeMap((querySnap: QuerySnap) =>
        from(forkJoin(
          querySnap.docs.map(doc => from(doc.ref.delete()))
        ))
      )
    );
}

