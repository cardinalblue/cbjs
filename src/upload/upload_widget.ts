import {Subject} from "rxjs"
import {Widget} from "../widget"
import {generateId} from "../util"

export class UploadWidget extends Widget {
  id = generateId()
  files$ = new Subject<File[]>()
  opened = false

  constructor() {
    super()
    console.log("++++ UploadWidget constructor")
  }

}
