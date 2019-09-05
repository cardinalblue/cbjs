"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
it('mapmap works', function () {
    expect(util_1.mapmap({ a: 2, b: 3 }, function (v) { return v + 1; })).toEqual({ a: 3, b: 4 });
});
it('arrayRemove works', function () {
    var a = [10, 20, 30, 40];
    util_1.arrayRemove(a, function (x) { return x === 20; });
    expect(a).toEqual([10, 30, 40]);
});
it('insertAt works', function () {
    expect(util_1.insertAt("abcdef", 0, "FOO")).toBe("FOOabcdef");
    expect(util_1.insertAt("abcdef", 1, "FOO")).toBe("aFOObcdef");
    expect(util_1.insertAt("", 3, "FOO")).toBe("FOO");
    expect(util_1.insertAt("", 300, "FOO")).toBe("FOO");
});
