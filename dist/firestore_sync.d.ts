import { Observable } from "rxjs";
import * as firebase from "firebase";
export declare type QuerySnap = firebase.firestore.QuerySnapshot;
export declare type DocSnap = firebase.firestore.DocumentSnapshot;
export declare type DocRef = firebase.firestore.DocumentReference;
export declare type CollectionRef = firebase.firestore.CollectionReference;
export declare type Query = firebase.firestore.Query;
export declare function firestoreGetDocument(docRef: DocRef): Observable<DocSnap>;
export declare function firestoreGetCollectionArray(ref: CollectionRef | Query): Observable<Array<DocSnap>>;
