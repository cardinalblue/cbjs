"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_rx_1 = require("./util_rx");
var rxjs_1 = require("rxjs");
var setup_test_1 = require("./setup_test");
var operators_1 = require("rxjs/operators");
it('lastOrEmpty works', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        ex(cold('--a---').pipe(util_rx_1.lastOrEmpty())).toBe('------');
        ex(cold('--a---|').pipe(util_rx_1.lastOrEmpty())).toBe('------(a|');
        ex(cold('------|').pipe(util_rx_1.lastOrEmpty())).toBe('------|');
    });
});
var Output2 = /** @class */ (function () {
    function Output2(s) {
        this.s = "out" + s;
    }
    return Output2;
}());
it('cachedMapper works', function () {
    var m = util_rx_1.cachedMapper(function (s) { return "k" + s; }, function (s) {
        return new Output2(s);
    });
    var o1 = m("1");
    var o2 = m("1");
    expect(o1).toEqual(o2);
    expect(o1 === o2).toEqual(true);
    var o3 = m("2");
    expect(o3.s).toEqual("out2");
});
var Output1 = /** @class */ (function () {
    function Output1(s) {
        this.s = "out" + s;
    }
    return Output1;
}());
it('cachedMapperArray works', function () {
    var mapper = util_rx_1.cachedMapperArray(function (s) { return "k" + s; }, function (s) { return new Output1(s); });
    var o1 = mapper(["1"]);
    expect(o1.length).toEqual(1);
    expect(o1[0].s).toEqual("out1");
    var o2 = mapper(["1"]);
    expect(o1).toEqual(o2);
    expect(o1[0] === o2[0]).toEqual(true);
    var o3 = mapper(["1", "2"]);
    expect(o1[0]).toEqual(o3[0]);
    expect(o1[0] === o3[0]).toEqual(true);
    expect(o3[0].s).toEqual("out1");
    expect(o3[1].s).toEqual("out2");
});
it('arrayMap works simple level', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        var sm = util_rx_1.arrayMap(function (x) { return rxjs_1.of(x); });
        ex(cold('--|').pipe(sm))
            .toBe('--|');
        ex(cold('-a-|', { a: [1, 3, 2] }).pipe(sm))
            .toBe('-a-|', { a: [1, 3, 2] });
        ex(cold('-a---b--|', { a: [1, 3, 2], b: [6, 5, 4] }).pipe(sm))
            .toBe('-a---b--|', { a: [1, 3, 2], b: [6, 5, 4] });
        ex(cold('-a-c-b--|', { a: [1, 3, 2], c: [], b: [6, 5, 4] }).pipe(sm))
            .toBe('-a-c-b--|', { a: [1, 3, 2], c: [], b: [6, 5, 4] });
    });
});
it('arrayMap works changing values', function () {
    var X = /** @class */ (function () {
        function X(i) {
            this.i = (typeof i === 'number') ?
                new rxjs_1.BehaviorSubject(i) : i;
        }
        return X;
    }());
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        var sm = util_rx_1.arrayMap(function (x) { return x.i; });
        var x1 = new X(10);
        var x2 = new X(20);
        var x3 = new X(30);
        // Typescript bindings for `cold` are wrong, so have to patch
        function _cold(marbles, values) {
            return cold(marbles, values);
        }
        // ---- Simple
        ex(cold('--|').pipe(sm))
            .toBe('--|');
        ex(cold('-----a---|', { a: [x2, x1, x3] }).pipe(sm))
            .toBe('-----a---|', { a: [20, 10, 30] });
        // ---- Changing values
        var x4 = new X(_cold('0----1---2------|', [5, 25, 15]));
        ex(_cold('--0--------------|', [[x2, x1, x3, x4]]).pipe(sm))
            .toBe('--0----1---2-----|', [[20, 10, 30, 5], [20, 10, 30, 25], [20, 10, 30, 15]]);
        ex(_cold('--0-------1------|', [[x2, x1, x3, x4], [x3, x1]]).pipe(sm))
            .toBe('--0----1--2------|', [[20, 10, 30, 5], [20, 10, 30, 25], [30, 10]]);
        // ---- With a delay in the sub value
        var x5 = new X(_cold('---0----1---2------|', [5, 25, 15]));
        ex(_cold('--0--------------|', [[x2, x1, x3, x5]]).pipe(sm))
            .toBe('-----0----1---2--|', [[20, 10, 30, 5], [20, 10, 30, 25], [20, 10, 30, 15]]);
        ex(_cold('--0---------1-------|', [[x2, x1, x3, x5], [x3, x1]]).pipe(sm))
            .toBe('-----0----1-2-------|', [[20, 10, 30, 5], [20, 10, 30, 25], [30, 10]]);
    });
});
// --------------------------------------------------------------
it('sortingMap works simple level', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        var sm = util_rx_1.sortingMap(function (x) { return rxjs_1.of(x); });
        ex(cold('--|').pipe(sm))
            .toBe('--|');
        ex(cold('-a-|', { a: [1, 3, 2] }).pipe(sm))
            .toBe('-a-|', { a: [1, 2, 3] });
        ex(cold('-a---b--|', { a: [1, 3, 2], b: [6, 5, 4] }).pipe(sm))
            .toBe('-a---b--|', { a: [1, 2, 3], b: [4, 5, 6] });
        ex(cold('-a-c-b--|', { a: [1, 3, 2], c: [], b: [6, 5, 4] }).pipe(sm))
            .toBe('-a-c-b--|', { a: [1, 2, 3], c: [], b: [4, 5, 6] });
    });
});
it('sortingMap works changing sort values', function () {
    var X = /** @class */ (function () {
        function X(i) {
            this.i = (typeof i === 'number') ?
                new rxjs_1.BehaviorSubject(i) : i;
        }
        return X;
    }());
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        var sm = util_rx_1.sortingMap(function (x) { return x.i; });
        var x1 = new X(10);
        var x2 = new X(20);
        var x3 = new X(30);
        // Typescript bindings for `cold` are wrong, so have to patch
        function _cold(marbles, values) {
            return cold(marbles, values);
        }
        // ---- Simple
        ex(cold('--|').pipe(sm))
            .toBe('--|');
        ex(cold('-----a---|', { a: [x2, x1, x3] }).pipe(sm))
            .toBe('-----a---|', { a: [x1, x2, x3] });
        // ---- Changing sorting
        var x4 = new X(_cold('0----1---2------|', [5, 25, 15]));
        ex(_cold('--0--------------|', [[x2, x1, x3, x4]]).pipe(sm))
            .toBe('--0----1---2-----|', [[x4, x1, x2, x3], [x1, x2, x4, x3], [x1, x4, x2, x3]]);
        ex(_cold('--0-------1------|', [[x2, x1, x3, x4], [x3, x1]]).pipe(sm))
            .toBe('--0----1--2------|', [[x4, x1, x2, x3], [x1, x2, x4, x3], [x1, x3]]);
        // With a delay in the sorting value
        var x5 = new X(_cold('---0----1---2------|', [5, 25, 15]));
        ex(_cold('--0--------------|', [[x2, x1, x3, x5]]).pipe(sm))
            .toBe('-----0----1---2--|', [[x5, x1, x2, x3], [x1, x2, x5, x3], [x1, x5, x2, x3]]);
        ex(_cold('--0---------1-------|', [[x2, x1, x3, x5], [x3, x1]]).pipe(sm))
            .toBe('-----0----1-2-------|', [[x5, x1, x2, x3], [x1, x2, x5, x3], [x1, x3]]);
    });
});
it('scan2 works', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        // Typescript bindings for `cold` are wrong, so have to patch
        function _cold(marbles, values) {
            return cold(marbles, values);
        }
        var values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        ex(_cold('--1---2----1---2--', values).pipe(util_rx_1.scan2("foo", function (acc, i) {
            return acc === "foo" ? 2 + i : acc + i;
        }))).toBe('--3---5----6---8--', values);
        ex(_cold('--1---2----1---2----1--', values).pipe(util_rx_1.scan2("foo", function (acc, i) {
            return acc === "foo" ? 2 + i : acc + i;
        }))).toBe('--3---5----6---8----9--', values);
    });
});
it('how share works', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        // Typescript bindings for `cold` are wrong, so have to patch
        function _cold(marbles, values) {
            return cold(marbles, values);
        }
        var values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        var hot = _cold('--1---2----1---2--', values).pipe(operators_1.share());
        ex(hot).toBe('--1---2----1---2--', values);
        ex(hot).toBe('--1---2----1---2--', values);
        var obs = new rxjs_1.Observable(function (subscriber) {
            subscriber.next(10);
            subscriber.next(20);
            subscriber.next(30);
            subscriber.next(40);
        });
        var shared = obs.pipe(operators_1.share());
        ex(shared).toBe('(0123)', [10, 20, 30, 40]);
        ex(shared).toBe('', [10, 20, 30, 40]);
    });
});
it(('takeDuring works'), function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        var a$ = cold("----a--b-----c----d-----e----f-");
        var c$ = cold("-----------m----n---|");
        ex(a$.pipe(util_rx_1.takeDuring(c$)))
            .toBe("----a--b-----c----d-|");
    });
});
it(('filterObservable works'), function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        var predicate = function (subs) { return subs.pipe(operators_1.map(function (s) { return (s.charCodeAt(0) % 2) === 0; }), operators_1.take(1)); };
        ex(cold("m-n--o-p-qrs", {
            m: cold("a-b-c-d-e"),
            n: cold("-f-g-h"),
            o: cold("--b-c-d"),
            p: cold("-g-h"),
            q: cold("-|"),
            r: cold("|"),
            s: cold("----h-i-j") // Check even if predicate no output will pass next
        })
            .pipe(util_rx_1.filterObservable(predicate), operators_1.mergeMap(function (_) { return _; })))
            .toBe("----f-g-hb-c-d-----h-i-j");
    });
});
it('pairFirst works', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        ex(cold('--').pipe(util_rx_1.pairFirst()))
            .toBe('---');
        ex(cold('-a-').pipe(util_rx_1.pairFirst()))
            .toBe('---');
        ex(cold('--a-b---c--d').pipe(util_rx_1.pairFirst()))
            .toBe('----m---n--o', { m: ['a', 'b'], n: ['a', 'c'], o: ['a', 'd'] });
    });
});
it('cachedMapper works', function () {
    var Output = /** @class */ (function () {
        function Output(s) {
            this.s = "out" + s;
        }
        return Output;
    }());
    var m = util_rx_1.cachedMapper(function (s) { return "k" + s; }, function (s) {
        console.log(">>>> new Output");
        return new Output(s);
    });
    var o1 = m("1");
    var o2 = m("1");
    expect(o1).toEqual(o2);
    expect(o1 === o2).toEqual(true);
    var o3 = m("2");
    expect(o3.s).toEqual("out2");
});
it('cachedMapperArray works', function () {
    var Output = /** @class */ (function () {
        function Output(s) {
            this.s = "out" + s;
        }
        return Output;
    }());
    var mapper = util_rx_1.cachedMapperArray(function (s) { return "k" + s; }, function (s) { return new Output(s); });
    var o1 = mapper(["1"]);
    expect(o1.length).toEqual(1);
    expect(o1[0].s).toEqual("out1");
    var o2 = mapper(["1"]);
    expect(o1).toEqual(o2);
    expect(o1[0] === o2[0]).toEqual(true);
    var o3 = mapper(["1", "2"]);
    expect(o1[0]).toEqual(o3[0]);
    expect(o1[0] === o3[0]).toEqual(true);
    expect(o3[0].s).toEqual("out1");
    expect(o3[1].s).toEqual("out2");
});
it('extend works', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        ex(rxjs_1.concat(cold('-a--|'), cold('---b-|')))
            .toBe('-a-----b-|');
        ex(rxjs_1.concat(cold('---|'), cold('----|')))
            .toBe('-------|');
        // Simple extend
        ex(cold('a--b--|').pipe(util_rx_1.extend(2, scheduler)))
            .toBe('a--b----|');
        ex(cold('a--b--|').pipe(util_rx_1.extend(4, scheduler)))
            .toBe('a--b------|');
        ex(cold('----|').pipe(util_rx_1.extend(4, scheduler)))
            .toBe('--------|');
        ex(cold('|').pipe(util_rx_1.extend(3, scheduler)))
            .toBe('---|');
    });
});
it('enqueue works', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        var q = util_rx_1.enqueue(function (x) { return x; }, scheduler);
        ex(cold('-|', { a: 1 }).pipe(q))
            .toBe('-|', { a: 1 });
        ex(cold('a-|', { a: 1 }).pipe(q))
            .toBe('a-|', { a: 1 });
        ex(cold('d---|', { d: 4 }).pipe(q))
            .toBe('d---|', { d: 4 });
        ex(cold('d--|', { d: 4 }).pipe(q))
            .toBe('d---|', { d: 4 });
        ex(cold('e--|', { e: 6 }).pipe(q))
            .toBe('e-----|', { e: 6 });
        ex(cold('e--c|', { e: 6, c: 3 }).pipe(q))
            .toBe('e-----c--|', { e: 6, c: 3 });
        ex(cold('b-----c|', { b: 2, c: 3 }).pipe(q))
            .toBe('b-----c--|', { b: 2, c: 3 });
    });
});
it('sortingMap works simple level', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        var sm = util_rx_1.sortingMap(function (x) { return rxjs_1.of(x); });
        ex(cold('--|').pipe(sm))
            .toBe('--|');
        ex(cold('-a-|', { a: [1, 3, 2] }).pipe(sm))
            .toBe('-a-|', { a: [1, 2, 3] });
        ex(cold('-a---b--|', { a: [1, 3, 2], b: [6, 5, 4] }).pipe(sm))
            .toBe('-a---b--|', { a: [1, 2, 3], b: [4, 5, 6] });
        ex(cold('-a-c-b--|', { a: [1, 3, 2], c: [], b: [6, 5, 4] }).pipe(sm))
            .toBe('-a-c-b--|', { a: [1, 2, 3], c: [], b: [4, 5, 6] });
    });
});
var X = /** @class */ (function () {
    function X(i) {
        this.i = (typeof i === 'number') ?
            new rxjs_1.BehaviorSubject(i) : i;
    }
    return X;
}());
it('sortingMap works changing sort values', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        var sm = util_rx_1.sortingMap(function (x) { return x.i; });
        var x1 = new X(10);
        var x2 = new X(20);
        var x3 = new X(30);
        // Typescript bindings for `cold` are wrong, so have to patch
        function _cold(marbles, values) {
            return cold(marbles, values);
        }
        // ---- Simple
        ex(cold('--|').pipe(sm))
            .toBe('--|');
        ex(cold('-----a---|', { a: [x2, x1, x3] }).pipe(sm))
            .toBe('-----a---|', { a: [x1, x2, x3] });
        // ---- Changing sorting
        var x4 = new X(_cold('0----1---2------|', [5, 25, 15]));
        ex(_cold('--0--------------|', [[x2, x1, x3, x4]]).pipe(sm))
            .toBe('--0----1---2-----|', [[x4, x1, x2, x3], [x1, x2, x4, x3], [x1, x4, x2, x3]]);
        ex(_cold('--0-------1------|', [[x2, x1, x3, x4], [x3, x1]]).pipe(sm))
            .toBe('--0----1--2------|', [[x4, x1, x2, x3], [x1, x2, x4, x3], [x1, x3]]);
        // With a delay in the sorting value
        var x5 = new X(_cold('---0----1---2------|', [5, 25, 15]));
        ex(_cold('--0--------------|', [[x2, x1, x3, x5]]).pipe(sm))
            .toBe('-----0----1---2--|', [[x5, x1, x2, x3], [x1, x2, x5, x3], [x1, x5, x2, x3]]);
        ex(_cold('--0---------1-------|', [[x2, x1, x3, x5], [x3, x1]]).pipe(sm))
            .toBe('-----0----1-2-------|', [[x5, x1, x2, x3], [x1, x2, x5, x3], [x1, x3]]);
    });
});
it('takes then terminates', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        ex(cold('---a---b-----c---|')
            .pipe(operators_1.take(1)))
            .toBe('---(a|');
    });
});
it('removed works', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        // Typescript bindings for `cold` are wrong, so have to patch
        function _cold(marbles, values) {
            return cold(marbles, values);
        }
        ex(_cold('01234567|', [
            [1, 2, 3],
            [2],
            [],
            [2, 2, 7],
            [7, 8, 8],
            [10, 11, 7],
            [4, 11],
            [4, 4, 4, 5],
        ])
            .pipe(util_rx_1.removed()))
            .toBe('-0123456|', [
            [1, 3],
            [2],
            [],
            [2, 2],
            [8, 8],
            [10, 7],
            [11],
        ]);
    });
});
it('undiff works', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        var values = {
            a: ['a'],
            b: ['b'],
            c: ['c'],
            d: ['d'],
            e: ['e'],
            f: ['f'],
            g: ['g'],
            h: ['h'],
        };
        var added$ = cold('---a------b--c-----e--fg--------|', values);
        var removed$ = cold('-------a-------c----------f---|', values);
        ex(util_rx_1.undiff(added$, removed$, ['z']))
            .toBe('---0---1--2--3-4---5--67--8-----|', [
            ['z', 'a'],
            ['z'],
            ['z', 'b'],
            ['z', 'b', 'c'],
            ['z', 'b'],
            ['z', 'b', 'e'],
            ['z', 'b', 'e', 'f'],
            ['z', 'b', 'e', 'f', 'g'],
            ['z', 'b', 'e', 'g'],
        ]);
    });
});
it('prolong works', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        ex(cold('-----a--------b---c--|')
            .pipe(util_rx_1.prolong(5, scheduler)))
            .toBe('-----0----1---2---34---5--|', [
            ['a'],
            [],
            ['b'],
            ['b', 'c'],
            ['c'],
            []
        ]);
    });
});
