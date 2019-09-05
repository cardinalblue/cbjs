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
it('cachedMapper works', function () {
    var Output = /** @class */ (function () {
        function Output(s) {
            this.s = "out" + s;
        }
        return Output;
    }());
    var m = util_rx_1.cachedMapper(function (s) { return "k" + s; }, function (s) {
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
var X = /** @class */ (function () {
    function X(i) {
        this.i = (typeof i === 'number') ?
            new rxjs_1.BehaviorSubject(i) : i;
    }
    return X;
}());
it('arrayMap works changing values', function () {
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
