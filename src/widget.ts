import {Point, Rect} from "./kor";
import {ContextedDomainer} from "./contexted_domainer";
import {Observable, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";

export class Widget extends ContextedDomainer
{
  isTarget(p: Point, rect: Rect): boolean {
    // Default implementation
    return p.x >= rect.origin.x &&
           p.y >= rect.origin.y &&
           p.x <  rect.origin.x + rect.size.width &&
           p.y <  rect.origin.y + rect.size.height

  }

  isEqual(other: any) {
    return this === other
  }

  // TEST OVERRIDE
  connecting$<T>(source: Observable<T>, destination: Subject<T>) {
    return source.pipe(
      takeUntil(this.shutdown$),
    ).subscribe(destination)
  }
}
