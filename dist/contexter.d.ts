declare type _Constructor<T> = new (...args: any[]) => T;
export interface Context {
}
export declare class Contexter {
    static curContexts: Context[][];
    private contexts;
    constructor(...contexts: Context[]);
    children<R>(block: () => R): R;
    has<C extends Context>(contextType: _Constructor<C>): boolean;
    get<C extends Context>(contextType: _Constructor<C>): C | null;
    get_<C extends Context>(contextType: _Constructor<C>): C;
    prepend(contexts: Contexter | Context[] | Context): void;
}
export {};
