import { DependencyList, MutableRefObject } from "react";
import { Queue } from "./util";
import { BehaviorSubject, Observable } from "rxjs";
export declare function useObservable<T>(observable: Observable<T>, defaultValue: T, inputs?: DependencyList): T;
export declare function useBehaviorSubject<T>(subject: BehaviorSubject<T>): T;
export declare function useObserving<T>(observable: Observable<T>, callback: (value: T) => void, inputs?: DependencyList): void;
export declare function useFocusing(ref: MutableRefObject<HTMLElement | null>, doFocus: Queue<boolean>): void;
