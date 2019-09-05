"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
function firestoreGetDocument(docRef) {
    return new rxjs_1.Observable(function (subs) {
        // `onSnapshot` already returns a function that ends the subscription
        return docRef.onSnapshot(function (snap) { return subs.next(snap); }, function (error) { return subs.error(error); }, function () { return subs.complete(); });
    });
}
exports.firestoreGetDocument = firestoreGetDocument;
function firestoreGetCollectionArray(ref) {
    return new rxjs_1.Observable(function (subs) {
        // `onSnapshot` already returns a function that ends the subscription
        return ref.onSnapshot({ includeMetadataChanges: false }, function (querySnap) {
            subs.next(querySnap.docs);
        }, function (error) { return subs.error(error); }, function () { return subs.complete(); });
    });
}
exports.firestoreGetCollectionArray = firestoreGetCollectionArray;
