"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var setup_test_1 = require("./setup_test");
var util_array_rx_1 = require("./util_array_rx");
var operators_1 = require("rxjs/operators");
var Output1 = /** @class */ (function () {
    function Output1(s) {
        this.disposed = false;
        this.s = "out" + s;
    }
    return Output1;
}());
it('cachedMapperArray works', function () {
    var mapper = util_array_rx_1.cachedMapperArray(function (s) { return "k" + s; }, function (s) { return new Output1(s); }, function (o) { o.disposed = true; });
    var o1 = mapper(["1"]);
    expect(o1.length).toEqual(1);
    expect(o1[0].s).toEqual("out1");
    expect(o1[0].disposed).toBeFalsy();
    var o2 = mapper(["1"]);
    expect(o1).toEqual(o2);
    expect(o1[0] === o2[0]).toEqual(true);
    expect(o2[0].disposed).toBeFalsy();
    var o3 = mapper(["1", "2"]);
    expect(o1[0]).toEqual(o3[0]);
    expect(o1[0] === o3[0]).toEqual(true);
    expect(o3[0].s).toEqual("out1");
    expect(o3[1].s).toEqual("out2");
    expect(o3[0].disposed).toBeFalsy();
    expect(o3[1].disposed).toBeFalsy();
    var o4 = mapper(["2"]);
    expect(o3[1]).toEqual(o4[0]);
    expect(o3[0].disposed).toBeTruthy();
    expect(o3[1].disposed).toBeFalsy();
});
it('arrayMap works simple level', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        var sm = util_array_rx_1.arrayMap(function (x) { return rxjs_1.of(x); });
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
        var sm = util_array_rx_1.arrayMap(function (x) { return x.i; });
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
        var sm = util_array_rx_1.sortingMap(function (x) { return rxjs_1.of(x); });
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
        var sm = util_array_rx_1.sortingMap(function (x) { return x.i; });
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
it('cachedMapperArray works', function () {
    var Output = /** @class */ (function () {
        function Output(s) {
            this.s = "out" + s;
        }
        return Output;
    }());
    var mapper = util_array_rx_1.cachedMapperArray(function (s) { return "k" + s; }, function (s) { return new Output(s); });
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
it('sortingMap works simple level', function () {
    var scheduler = setup_test_1.testScheduler();
    scheduler.run(function (helpers) {
        var cold = helpers.cold, ex = helpers.expectObservable;
        var sm = util_array_rx_1.sortingMap(function (x) { return rxjs_1.of(x); });
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
        var sm = util_array_rx_1.sortingMap(function (x) { return x.i; });
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
            .pipe(util_array_rx_1.removed()))
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
        ex(util_array_rx_1.undiff(added$, removed$, ['z']))
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
it('arrayFilterMap works changing values', function () {
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
        var fm = util_array_rx_1.arrayFilterMap(function (x) {
            return x.i.pipe(operators_1.map(function (i) { return i % 2 === 0; }));
        });
        var x1 = new X(10);
        var x2 = new X(20);
        var x3 = new X(30);
        // Typescript bindings for `cold` are wrong, so have to patch
        function _cold(marbles, values) {
            return cold(marbles, values);
        }
        // ---- Simple
        console.log(">>>> test 1");
        ex(_cold('--|', []).pipe(fm))
            .toBe('--|');
        console.log(">>>> test 2");
        ex(cold('-----a---|', { a: [x2, x1, x3] }).pipe(fm))
            .toBe('-----a---|', { a: [x2, x1, x3] });
        // ---- Changing values
        var x4 = new X(_cold('0----1---2------|', [5, 40, 15]));
        ex(cold('--a--------------|', { a: [x2, x1, x4, x3] }).pipe(fm))
            .toBe('--a----b---c-----|', { a: [x2, x1, x3], b: [x2, x1, x4, x3], c: [x2, x1, x3] });
        ex(cold('--a-------b------|', { a: [x4, x2, x1, x3], b: [x3, x1] }).pipe(fm))
            .toBe('--a----b--c------|', { a: [x2, x1, x3], b: [x4, x2, x1, x3], c: [x3, x1] });
    });
});
