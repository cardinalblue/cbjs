import {Contexter} from "./contexter";
import {Domainer} from "./domainer";

export class ContextedDomainer extends Domainer {
  contexter = new Contexter()

  legate<R>(block: () => R): R {
    return this.contexter.legate(block)
  }
}