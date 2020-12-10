import {BehaviorSubject, Subject} from "rxjs";
import {ID} from "./util"
import {Widget} from "./widget"

export type Choice = { id: ID, title: string }
export class ChoiceWidget<T extends Choice> extends Widget {
  tapped$ = new Subject<boolean>()
  constructor(readonly t: T, readonly id = t.id) {
    super()
  }
}
export class ChooserWidget<T extends Choice> extends Widget {
  choiceWidgets$ = new BehaviorSubject<ChoiceWidget<T>[]>([])
}

