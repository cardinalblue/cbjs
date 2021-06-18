import {Contexter} from "./contexter";
import {Domainer} from "./domainer";
import {first} from "rxjs/operators"

export class ContextedDomainer extends Domainer {
  contexter = new Contexter()
  static DEFAULT = new ContextedDomainer()

  // ---- Legate should be called on every CHILD of this ContextedDomainer.
  //      Legating has 2 effects:
  //        - Passes on the Context.
  //        - Will propagate the shutdown$ signal.
  //
  legate<R extends ContextedDomainer, RS extends R|Array<R>>(block: () => RS): RS {

    // ---- Instantiate child
    const created: RS = this.contexter.legate(block)
    const children = created instanceof Array ? created : [created]

    // ---- Connect shutdown$
    children.forEach(c =>
      this.shutdown$.pipe(first())
        .subscribe(c.shutdown$)
    )

    return created
  }
}