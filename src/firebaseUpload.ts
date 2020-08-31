import firebase from 'firebase'
import {flatMap} from "rxjs/operators";
import {from, Observable} from "rxjs"
import {UploadTaskSnapshot} from "./firestore_sync"

export function firestoreUploadImage(file: File, folder='')
  : Observable<string>
{
  const name_esc = file.name.replace(/[^.a-z0-9]/gi, '_')
  const filename = Math.random().toString(36).substr(2, 5) + name_esc
  const snapshot$: Observable<UploadTaskSnapshot> = new Observable(subscriber => {
    var ref = firebase.storage().ref()
    if (folder)
      ref = ref.child(folder)
    ref.child(filename).put(file).then(
      (uploadSnapshot: UploadTaskSnapshot) => {
        subscriber.next(uploadSnapshot)
        subscriber.complete()
      },
      error => subscriber.error(error)
    )
  })
  return snapshot$.pipe(
    flatMap(s => from(s.ref.getDownloadURL()))
  )
}
