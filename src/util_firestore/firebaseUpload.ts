import firebase from "firebase/app";
import {mergeMap} from "rxjs/operators";
import {from, Observable} from "rxjs"
import {UploadTaskSnapshot} from "./index"


export function filenameFromFile(file: File) {
  const name_esc = file.name.replace(/[^.a-z0-9]/gi, '_')
  return Math.random().toString(36).substr(2, 5) + name_esc
}

export function firestoreUploadImage(file: File,
                                     folder='',
                                     filename: string = filenameFromFile(file))
  : Observable<string>
{
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
    mergeMap(s => from(s.ref.getDownloadURL()))
  )
}



