import {EMPTY, Observable, zip} from "rxjs";

export class Command<T,MEMO=any> {
  static NOP = new Command('NOP', () => EMPTY)
  memo: MEMO|undefined
  constructor(readonly description: string,
              readonly executionF:    (command: Command<T,MEMO>) => Observable<T>,
              readonly unexecutionF:  (command: Command<T,MEMO>) => Observable<T> = () => EMPTY)
  {}

  execution()  : Observable<T> { return this.executionF(this) }
  unexecution(): Observable<T> { return this.unexecutionF(this) }
}

export function commandCompose<T,MEMO=any>(...commands: Command<T,MEMO>[])
  : Command<T[],MEMO>
{
  // LEARN: Composing easy!
  return new Command(
    commands.join("|"),
    () => zip(...commands.map(c => c.execution())),
    () => zip(...commands.map(c => c.unexecution())),
  )
}
export function commandComposeAny(...commands: Command<any, any>[])
  : Command<any[],any>
{
  // LEARN: Composing easy!
  return new Command(
    commands.join("|"),
    () => zip(...commands.map(c => c.execution())),
    () => zip(...commands.map(c => c.unexecution())),
  )
}
