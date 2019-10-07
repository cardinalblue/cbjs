"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var _ = __importStar(require("lodash"));
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
function arraySubjectAdd(subject, t) {
    console.log(">>>> arraySubjectAdd", t);
    subject.next(_.concat(subject.value, t));
}
exports.arraySubjectAdd = arraySubjectAdd;
function arraySubjectRemove(subject, t) {
    console.log(">>>> arraySubjectRemove", t);
    subject.next(_.without(subject.value, t));
}
exports.arraySubjectRemove = arraySubjectRemove;
function added() {
    return function (source) { return source.pipe(operators_1.pairwise(), operators_1.map(function (_a) {
        var t0 = _a[0], t1 = _a[1];
        return _.difference(t1, t0);
    })); };
}
exports.added = added;
function removed() {
    return function (source) { return source.pipe(operators_1.pairwise(), operators_1.map(function (_a) {
        var t0 = _a[0], t1 = _a[1];
        return _.difference(t0, t1);
    })); };
}
exports.removed = removed;
function undiff(added$, removed$, seed) {
    if (seed === void 0) { seed = []; }
    var merged$ = rxjs_1.merge(added$.pipe(operators_1.map(function (t) { return [true, t]; })), removed$.pipe(operators_1.map(function (t) { return [false, t]; })));
    return merged$.pipe(operators_1.scan(function (acc, _a) {
        var op = _a[0], t = _a[1];
        return op ? __spreadArrays(acc, t) : _.without.apply(_, __spreadArrays([acc], t));
    }, seed));
}
exports.undiff = undiff;
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
//
function mergingMap(inner) {
    return operators_1.mergeMap(function (t) {
        var outputs = [];
        outputs.push(inner(t, function (output$) { return outputs.push(output$); }));
        return rxjs_1.merge.apply(void 0, outputs);
    });
}
exports.mergingMap = mergingMap;
