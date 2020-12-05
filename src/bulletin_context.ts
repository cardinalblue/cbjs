import {BehaviorSubject} from "rxjs";
import {Context} from "./contexter"

export class BulletinContext implements Context {
  constructor(readonly bulletin$: BehaviorSubject<string|null>) {}
}