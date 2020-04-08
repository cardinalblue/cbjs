import {Command} from "./command";
import {Context, Domainer} from "cbjs";
import {BehaviorSubject} from "rxjs";
import {List} from "immutable";
import {map} from "rxjs/operators";

// LEARN: how to extend existing classes.

// ---- Extend Command for the convenience `push` method
// See https://medium.com/@OlegVaraksin/modern-way-of-adding-new-functionality-to-typescript-libraries-by-patching-existing-modules-6dcde608de56
//
declare module "./command" {
  interface Command<T> {
    push(context: UndoContext): Command<T>
  }
}
Command.prototype.push = function(context: UndoContext) {
  context.push(this)
  return this
}

export class UndoContext extends Domainer implements Context {
  undo$ = new BehaviorSubject(List<Command<any>>())
  redo$ = new BehaviorSubject(List<Command<any>>())
  canUndo$ = new BehaviorSubject<boolean>(false)
  canRedo$ = new BehaviorSubject<boolean>(false)

  constructor() {
    super();
    this.connecting(
      this.undo$.pipe(map(list => list.size > 0)),
      this.canUndo$)
    this.connecting(
      this.redo$.pipe(map(list => list.size > 0)),
      this.canRedo$)
  }

  popUndo(): Command<any>|undefined {
    const c = this.undo$.value.last(undefined)
    if (c) {
      this.undo$.next(this.undo$.value.butLast())
      this.redo$.next(this.redo$.value.push(c))
    }
    return c
  }
  popRedo(): Command<any>|undefined {
    const c = this.redo$.value.last(undefined)
    if (c) {
      this.undo$.next(this.undo$.value.push(c))
      this.redo$.next(this.redo$.value.butLast())
    }
    return c
  }
  push(c: Command<any>): Command<any> {
    this.undo$.next(this.undo$.value.push(c))
    this.redo$.next(List())
    return c
  }
}

