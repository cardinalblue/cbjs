import {Contexter} from "./contexter";
import {Domainer} from "./domainer";
import {first} from "rxjs/operators"

export class ContextedDomainer extends Domainer {
  contexter = new Contexter()

  // ---- Legate should be called on every CHILD of this ContextedDomainer.
  //      Legating has 2 effects:
  //        - Passes on the Context.
  //        - Will propagate the shutdown$ signal.
  //
  legate<R extends ContextedDomainer>(block: () => R): R {

    // ---- Instantiate child
    const child = this.contexter.legate(block)

    // ---- Connect shutdown$
    this.shutdown$.pipe(first())
      .subscribe(child.shutdown$)

    return child
  }
}