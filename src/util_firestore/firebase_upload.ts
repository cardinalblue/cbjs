import {getDownloadURL, getStorage, ref, uploadBytes, UploadMetadata, UploadResult} from "firebase/storage";
import {mergeMap} from "rxjs/operators";
import {from, Observable} from "rxjs"


export function filenameFromFile(file: File) {
  const name_esc = file.name.replace(/[^.a-z0-9]/gi, '_')
  return Math.random().toString(36).substr(2, 5) + name_esc
}

export function firebaseUploadImage(file: File,
                                    folder='',
                                    filename: string = filenameFromFile(file),
                                    metadata?: UploadMetadata)
  : Observable<string>
{
  const snapshot$: Observable<UploadResult> = new Observable(subscriber => {
    let loc = ref(getStorage())
    if (folder)
      loc = ref(loc, folder)
    uploadBytes(ref(loc, filename), file, metadata).then(
      (result: UploadResult) => {
        subscriber.next(result)
        subscriber.complete()
      },
      error => subscriber.error(error)
    )
  })
  return snapshot$.pipe(
    mergeMap(result => from(getDownloadURL(result.ref)))
  )
}



