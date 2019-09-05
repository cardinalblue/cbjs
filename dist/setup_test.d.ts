/// <reference types="jest" />
import { Elementable } from "./util";
import { TestScheduler } from 'rxjs/testing';
export declare function expectElem<T>(x: Elementable<T>): jest.Matchers<(T extends ArrayLike<any> ? never : T)[]>;
export declare function testScheduler(): TestScheduler;
