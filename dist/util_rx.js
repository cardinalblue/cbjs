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
var util_1 = require("./util");
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
function takeDuring(control$) {
    var stop$ = control$.pipe(operators_1.last(function (_) { return false; }, true));
    return operators_1.takeUntil(stop$);
}
exports.takeDuring = takeDuring;
function filterTruthy() {
    return function (s) {
        return s.pipe(operators_1.filter(function (x) { return x !== null && x !== undefined; }));
    };
}
exports.filterTruthy = filterTruthy;
// Delays passing on the Observable until the predicate Observable issues a single
// true or false.
//
function filterObservable(predicate) {
    return function (source) {
        return rxjs_1.zip(source, source.pipe(operators_1.flatMap(function (s) {
            return predicate(s).pipe(operators_1.first(function (_) { return true; }, false)
            // WARNING: `first` is different in RxJS that in RxJava!
            );
        })))
            .pipe(operators_1.filter(function (_a) {
            var orig = _a[0], bool = _a[1];
            return bool;
        }), operators_1.map(function (_a) {
            var orig = _a[0], bool = _a[1];
            return orig;
        }));
    };
}
exports.filterObservable = filterObservable;
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
//----------------------------------------------------------------
// Delays the completion by t
//
//   ------1-------------2-----3----|
//
// will output
//
//   ------1-------------2-----3----==========|
//
//
function extend(t, scheduler) {
    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
    if (t <= 0)
        return function (x) { return x; };
    return function (source) {
        return rxjs_1.concat(source, rxjs_1.defer(function () {
            return rxjs_1.timer(t).pipe(operators_1.ignoreElements());
        }));
    };
}
exports.extend = extend;
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
// ----------------------------------------------------------------
// Given input
//
//   ------1-------------2--------------------3------------------>
//
// will output
//
//   ------1=================|2======|--------3========|--------->
//
// where the length of each is calculated by the given function.
//
function enqueue(durationF, scheduler) {
    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
    return function (source) {
        return source.pipe(operators_1.concatMap(function (x) {
            return rxjs_1.of(x).pipe(extend(durationF(x)));
        }));
    };
}
exports.enqueue = enqueue;
// ----------------------------------------------------------------
// Accumulates the incoming values to be "active" for a fixed time.
// Outputs the current values as they become active or inactive.
//
//   ------1-------------2-----3------|
//
// will output
//
//   ------[1]=======[]--[2]===[2,3]=[3]=====|
//
//
function prolong(t, scheduler) {
    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
    return function (source) {
        var add$ = source.pipe(operators_1.map(function (t) { return [true, t]; }));
        var del$ = source.pipe(operators_1.delay(t, scheduler), operators_1.map(function (t) { return [false, t]; }));
        return rxjs_1.merge(add$, del$).pipe(operators_1.scan(function (acc, _a) {
            var op = _a[0], t = _a[1];
            return util_1.LOG(">>>> prolong ====", op ? __spreadArrays(acc, [t]) : util_1.withoutFirst(acc, t), acc, op, t);
        }, []));
    };
}
exports.prolong = prolong;
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
// ----------------------------------------------------------------
//
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
// ----------------------------------------------------------------------------
// mergingMap:
//
// Works like `mergeMap` but takes a function which can be used to produce extra
// output Observables, all of which will get merged together into one output.
// The inner function must produce at least one Observable.
function pairFirst() {
    return function (source) {
        return rxjs_1.combineLatest([
            source.pipe(operators_1.take(1)),
            source.pipe(operators_1.skip(1))
        ]).pipe();
    };
}
exports.pairFirst = pairFirst;
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
