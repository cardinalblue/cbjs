import { BehaviorSubject } from "rxjs";
export declare function fieldToStringNullable(field: any): string | null;
export declare function fieldToString(field: any, _default?: string): string;
export declare function fieldUpdate<T>(value: T, to: BehaviorSubject<T>): void;
