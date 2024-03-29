import {concat, Observable, of, throwError} from "rxjs";
import {map, mergeMap} from "rxjs/operators";
import {CollectionRef, DocRef, firestoreDeleteCollection} from "./firestore_sync"
import {addDoc, deleteDoc, doc, setDoc, updateDoc, DocumentData} from "firebase/firestore"
import {PartialExceptFor, SubsetBehaviorSubject$} from "../util_types"
import {promise$} from "../util_rx"
import {ID} from "../util"



export type Creation<M> =
  Partial<SubsetBehaviorSubject$<M>>
export type CreationRequiring<M, MRequired extends keyof SubsetBehaviorSubject$<M>> =
  PartialExceptFor<SubsetBehaviorSubject$<M>, MRequired>

export function firestoreModelCreate<STRUCT>(collectionRef: CollectionRef,
                                             struct: Partial<STRUCT>,
                                             id?: ID)
  : Observable<DocRef>
{
  let write$: Observable<DocRef>
  if (id === undefined)
    write$ = promise$(() => addDoc(collectionRef, struct as DocumentData))
  else {
    const docRef = doc(collectionRef, id)
    write$ = promise$(() => setDoc(docRef, struct as DocumentData)).pipe(
      map(_ => docRef))
  }
  console.log("++++ firestoreModelCreate write$", write$)
  return write$
    .pipe(
      mergeMap(docRef => {
        if (!docRef) {
          console.error("++++ commandCreate unable to create")
          return throwError("Unable to create Firestore document")
        } else {
          return of(docRef)
        }
      })
    )
}

export function firestoreModelPut<STRUCT>(collectionRef: CollectionRef,
                                          struct: Partial<STRUCT>)
  : Observable<DocRef>
{

  return promise$(
    () => addDoc(collectionRef, struct as DocumentData))
    .pipe(
      mergeMap(docRef => {
        if (!docRef) {
          console.error("++++ commandCreate unable to create")
          return throwError("Unable to create Firestore document")
        } else {
          return of(docRef)
        }
      })
    )
}

export type Update<M> = Partial<SubsetBehaviorSubject$<M>>
export function firestoreModelUpdate<STRUCT>(docRef: DocRef,
                                             struct: Partial<STRUCT>)
  : Observable<DocRef>
{
  return promise$(() =>
    updateDoc(docRef, struct as DocumentData)
  ).pipe(
    map(_ => docRef)
  )
}

export function firestoreModelDelete(docRef: DocRef,
                                     subcollectionsRef: CollectionRef[] = [])
  : Observable<DocRef>
{
  const collectionRef = docRef.parent
  return concat(
    // ---- Delete subcollections
    ...[
      subcollectionsRef.map(c =>
        firestoreDeleteCollection(c))
    ],
    // ---- Delete document
    promise$(() => deleteDoc(doc(collectionRef, docRef.id)))
  ).pipe(
    map(_ => docRef)
  )
}

