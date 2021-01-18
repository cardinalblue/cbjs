import {Widget} from "../widget"
import {generateId} from "../util"
import {Point} from "../kor"

export class ProgressWidget extends Widget
{
  id = generateId()
  constructor(readonly point: Point) {
    super()
    console.log("++++ ProgressWidget constructor")
  }
}
