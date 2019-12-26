import {last} from "./util"
import _ from "lodash"

type _Constructor<T> = new (...args:any[]) => T

export interface Context {}

export class Contexter {
  static curContexts: Context[][] = []
  private contexts: Context[]

  static DEFAULT = new Contexter()

  constructor(...contexts: Context[]) {
    this.contexts = [ ...(last(Contexter.curContexts) || []), ...contexts ]
  }
  legate<R>(block: () => R): R {
    Contexter.curContexts.push(this.contexts)
    const r = block()
    Contexter.curContexts.pop()
    return r
  }
  adopt<R extends { contexter: Contexter }>(_child: R): R {
    _child.contexter.prepend(this.contexts)
    return _child
  }
  has<C extends Context>(contextType: _Constructor<C>): boolean {
    return _.findIndex(this.contexts, c => c instanceof contextType) >= 0
  }
  get<C extends Context>(contextType: _Constructor<C>): C|null {
    const found = _.findLast(this.contexts, c => c instanceof contextType)
    return (found as C) || null
  }
  use<C extends Context>(contextType: _Constructor<C>): C {
    const c = this.get(contextType)
    if (!c) throw Error(`Context ${contextType} not set`)
    return c
  }
  prepend(contexts: Contexter|Context[]|Context) {
    const c = (contexts instanceof Contexter)? contexts.contexts :
              (contexts instanceof Array)? contexts :
              [contexts]
    this.contexts = [...c, ...this.contexts]
  }
}
// -----------------------------------------------------------------
// Usage example:

class MyContextType implements Context {
  constructor(readonly s: string) {}
}

class X {
  contexter = new Contexter();    // Gets the context from the stack

  someMethod() {

    // Creating legate that will get passed on the Context
    this.contexter.legate(() => {
      // Code that creates legate, will automatically get a copy of parent contexts
    })

    // Reading the Context
    const c = this.contexter.get(MyContextType)
  }
}

