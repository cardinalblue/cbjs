import {forkJoin, from, Observable, Subscriber} from "rxjs"
import {mergeMap} from "rxjs/operators";
import {promise$} from "../util_rx";
import {
  CollectionReference,
  deleteDoc,
  DocumentReference,
  DocumentSnapshot,
  getDocs,
  onSnapshot,
  Query,
  QuerySnapshot,
} from "firebase/firestore"

export type QuerySnap           = QuerySnapshot
export type DocSnap             = DocumentSnapshot
export type DocRef              = DocumentReference
export type CollectionRef       = CollectionReference

export function firestoreSyncDocument(docRef: DocRef)
  : Observable<DocSnap>
{
  return new Observable((subs: Subscriber<DocSnap>) =>
    // `onSnapshot` already returns a function that ends the subscription
    onSnapshot(docRef,
      snap => snap.exists() ?
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
    onSnapshot(ref,
      { includeMetadataChanges: true },
      (querySnap: QuerySnap) => {
        subs.next(querySnap.docs)
      },
      (error: Error) => subs.error(error),
      () => subs.complete()
    )
  )
}

export function firestoreDeleteCollection(collectionRef: CollectionRef)
//  : Observable<void[]>
{
  const snap$ = promise$(() => getDocs(collectionRef))
  return snap$.pipe(
    mergeMap((querySnap: QuerySnap) =>
      from(forkJoin([...
        querySnap.docs.map(doc =>
          from(deleteDoc(doc.ref))
        )
      ]))
    )
  );
}

