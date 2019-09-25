"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
exports.IDENTITY = function (t) { return t; };
exports.PASSTHRU = function (t) { return rxjs_1.of(t); };
// --------------------------------------------------------------------
// Operators
function lastOrEmpty() {
    return function (source) {
        return source.pipe(operators_1.last(), operators_1.catchError(function (err) { return rxjs_1.EMPTY; }));
    };
}
exports.lastOrEmpty = lastOrEmpty;
function filterFirst() {
    return operators_1.filter(function (value, index) { return index === 0; });
}
exports.filterFirst = filterFirst;
function detour(selector, observableTrue, observableFalse) {
    if (observableTrue === void 0) { observableTrue = exports.PASSTHRU; }
    if (observableFalse === void 0) { observableFalse = exports.PASSTHRU; }
    return operators_1.flatMap(function (t) {
        return selector(t) ? observableTrue(t) : observableFalse(t);
    });
}
exports.detour = detour;
function interject(f) {
    return operators_1.concatMap(function (t) {
        return rxjs_1.concat(f(t).pipe(operators_1.ignoreElements()), rxjs_1.of(t));
    });
}
exports.interject = interject;
// Redefine the RxJS `scan` so that we can have a separate initial SEED type.
// Note also the argument order is reversed.
//
function scan2(seed, f) {
    return operators_1.scan(f, seed);
    // OK to case because since `f` ONLY returns R, the whole thing can only
    // return R!
}
exports.scan2 = scan2;
// `map` that also removes null|undefined from the output.
function filtering(f) {
    return function (source) {
        return source.pipe(operators_1.map(f), operators_1.filter(function (r) { return !!r; }));
    }; // We are filtering the undefined|null
}
exports.filtering = filtering;
function finding(f) {
    return filtering(function (a) { return a.find(f); });
}
exports.finding = finding;
function doOnSubscribe(onSubscribe) {
    return function inner(source) {
        return rxjs_1.defer(function () {
            onSubscribe();
            return source;
        });
    };
}
exports.doOnSubscribe = doOnSubscribe;
// ---------------------------------------------------------------------------
function cachedMapper(keyF, mapF) {
    var cache = new Map();
    return function (tFrom) {
        var key = keyF(tFrom);
        var prev = cache.get(key);
        if (prev) {
            return prev;
        }
        // else
        var output = mapF(tFrom);
        cache.set(key, output);
        return output;
    };
}
exports.cachedMapper = cachedMapper;
function cachedMapperArray(keyF, createF) {
    var cachePrev = new Map();
    return function (tFrom) {
        var cacheCur = new Map();
        var output = tFrom.map(function (tFrom) {
            var key = keyF(tFrom);
            var prev = cacheCur.get(key) || cachePrev.get(key);
            if (prev) {
                cacheCur.set(key, prev);
                return prev;
            }
            // else
            var tTo = createF(tFrom);
            cacheCur.set(key, tTo);
            return tTo;
        });
        // Update the cache
        cachePrev = cacheCur;
        return output;
    };
}
exports.cachedMapperArray = cachedMapperArray;
// ----------------------------------------------------------------
//
//
function arrayMap(mapper) {
    return function (source) {
        var source$ = source.pipe(operators_1.share()); // Turn into Hot so we can use it in takeUntil
        var sourceFinished$ = source$.pipe(operators_1.last(null, true));
        return source$.pipe(operators_1.switchMap(function (xs) {
            // Convert each Array of elements into an Array of streams.
            var obs$ = xs.map(mapper);
            // Because combineLatest([]) returns a "nothing" Observable
            // we have to handle it especially.
            if (obs$.length === 0) {
                return rxjs_1.of([]);
            }
            else {
                return rxjs_1.combineLatest(obs$).pipe(operators_1.takeUntil(sourceFinished$));
            }
        }));
    };
}
exports.arrayMap = arrayMap;
function zipEmptiable() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    if (observables.length === 0) {
        return rxjs_1.of([]);
    }
    return rxjs_1.zip.apply(void 0, observables);
}
exports.zipEmptiable = zipEmptiable;
function sortingMap(comparatorF) {
    return function (source) {
        var source$ = source.pipe(operators_1.share()); // Turn into Hot so we can use it in takeUntil
        var sourceFinished$ = source$.pipe(operators_1.last(null, true));
        return source$.pipe(operators_1.switchMap(function (xs) {
            // Convert each Array of elements into an Array of streams.
            // Each stream produces Pairs of <comparable, element> (as the comparable changes).
            var obs = xs.map(function (x) {
                // Generate stream of comparables,
                // then pair the comparables with the original element
                return comparatorF(x).pipe(operators_1.map(function (comparator) { return ({ comparator: comparator, x: x }); }));
            });
            // Because combineLatest([]) returns a "nothing" Observable
            // we have to handle it especially.
            if (obs.length === 0) {
                return rxjs_1.of([]);
            }
            else {
                // Combine to form a stream of Lists of Pairs of <comparable, element>, sorted
                var compareF_1 = function (a, b) {
                    return (typeof a === 'number') ? a - b : a.compare(b);
                };
                return rxjs_1.combineLatest(obs).pipe(operators_1.takeUntil(sourceFinished$), // Stop when the original source finished
                operators_1.map(function (pairs) {
                    return __spreadArrays(pairs).sort(function (a, b) { return compareF_1(a.comparator, b.comparator); });
                }), operators_1.map(function (pairs) {
                    return pairs.map(function (pair) { return pair.x; });
                }));
            }
        }));
    };
}
exports.sortingMap = sortingMap;
// ----------------------------------------------------------------------------
// Promise utility
function promiseToObservable(f) {
    return new rxjs_1.Observable(function (subs) {
        var promise = f();
        subs.next(rxjs_1.from(promise));
        subs.complete();
    })
        .pipe(operators_1.flatMap(function (x) { return x; }));
}
exports.promiseToObservable = promiseToObservable;
// ----------------------------------------------------------------
// Utility methods
function finding$(a$, f) {
    return a$.pipe(finding(f));
}
exports.finding$ = finding$;
