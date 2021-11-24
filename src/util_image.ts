import {Size} from "./kor"
import {Observable} from "rxjs"

function extractSizeFromImage$(file: File): Observable<Size> {
  return new Observable<Size>(subscriber => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      subscriber.next(new Size(image.width, image.height))
      subscriber.complete()
    }
    image.onerror = (e) =>
      subscriber.error(e)
    image.src = url

    // ---- Cleanup
    return () => URL.revokeObjectURL(url)
  })
}
