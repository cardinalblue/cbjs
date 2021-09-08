import {CollectionRef, DocRef, DocSnap, QuerySnap} from "./firestore_sync"
import {addDoc, getDoc, getDocs} from "firebase/firestore"
import {EMPTY, Observable, of, throwError, zip} from "rxjs"
import {promise$} from "../util_rx"
import {mergeMap} from "rxjs/operators"

export function firestoreCloneReference(originalDoc: DocRef,
                                        toCollection: CollectionRef,
                                        extra: Object = {})
  : Observable<DocRef>
{
  return promise$(() => getDoc(originalDoc)).pipe(
    mergeMap(docSnap => docSnap.exists() ?
      firestoreCloneSnapshot(docSnap, toCollection, extra)
      : EMPTY),
  )
}
export function firestoreCloneSnapshot(from: DocSnap,
                                       toCollection: CollectionRef,
                                       extra: Object = {})
  : Observable<DocRef>
{
  const data = from.data()
  if (!data)
    return throwError(`No data on docSnap ${from.id}`)
  return promise$<DocRef>(() =>
    addDoc(toCollection, { ...data, ...extra }))

}
export function firestoreCloneCollection(fromCollection: CollectionRef,
                                         toCollection: CollectionRef,
                                         extra: Object = {})
  : Observable<DocRef[]>
{
  return promise$(() => getDocs(fromCollection)).pipe(
    mergeMap((querySnap: QuerySnap) =>
      querySnap.empty ? of([]) : of(querySnap.docs)
    ),
    mergeMap(array => {
      if (array.length === 0)
        return of([])
      const eachSnap = (docSnap: DocSnap) =>
        firestoreCloneSnapshot(docSnap, toCollection, extra)
      return zip(...array.map(eachSnap))
    })
  )
}
