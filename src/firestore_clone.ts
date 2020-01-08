import {CollectionRef, DocRef, DocSnap, firestoreSyncCollectionArray} from "./firestore_sync"
import {Observable, throwError, zip} from "rxjs"
import {promise$} from "./util_rx"
import {first, flatMap} from "rxjs/operators"

export function firestoreCloneReference(from: DocRef,
                                        toCollection: CollectionRef,
                                        extra: Object = {})
    : Observable<DocRef>
{
    return promise$(() => from.get()).pipe(
        flatMap((docSnap: DocSnap) => firestoreCloneSnapshot(docSnap, toCollection, extra)),
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
        toCollection.add({ ...data, ...extra }))

}
export function firestoreCloneCollection(fromCollection: CollectionRef,
                                         toCollection: CollectionRef)
    : Observable<DocRef[]>
{
    return firestoreSyncCollectionArray(fromCollection).pipe(
        first(),
        flatMap(array => {
            const eachSnap = (docSnap: DocSnap) => firestoreCloneSnapshot(docSnap, toCollection)
            return zip(...array.map(eachSnap))
        })
    )
}

