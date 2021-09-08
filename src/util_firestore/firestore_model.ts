import {concat, Observable, of, throwError} from "rxjs";
import {map, mergeMap} from "rxjs/operators";
import {CollectionRef, DocRef, firestoreDeleteCollection} from "./firestore_sync"
import {addDoc, deleteDoc, doc, updateDoc} from "firebase/firestore"
import {PartialExceptFor, SubsetBehaviorSubject$} from "../util_types"
import {promise$} from "../util_rx"
import firebase from "firebase/compat"
import DocumentData = firebase.firestore.DocumentData


export type Creation<M> =
  Partial<SubsetBehaviorSubject$<M>>
export type CreationRequiring<M, MRequired extends keyof SubsetBehaviorSubject$<M>> =
  PartialExceptFor<SubsetBehaviorSubject$<M>, MRequired>

export function firestoreModelCreate<STRUCT>(collectionRef: CollectionRef,
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

