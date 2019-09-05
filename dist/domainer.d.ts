import { Observable, Subject } from "rxjs";
import { switchMap } from "rxjs/operators";
export declare class Domainer {
    shutdown$: Subject<any>;
    triggering<T, M>(trigger$: Observable<T>, manipulator: (t: T) => Observable<M>, monad?: typeof switchMap): import("rxjs").Subscription;
    connecting<T>(source: Observable<T>, destination: Subject<T>): import("rxjs").Subscription;
}
