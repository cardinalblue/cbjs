"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var _ = __importStar(require("lodash"));
var testing_1 = require("rxjs/testing");
beforeEach(function () {
    jest.addMatchers({
        toBeEnumerableCloseTo: function () {
            return {
                compare: function (actual, expected, precision) {
                    if (precision === void 0) { precision = 0.0001; }
                    var _loop_1 = function (index, e) {
                        var a = actual[index];
                        if ((typeof a == 'undefined') || Math.abs(a - e) > precision) {
                            return { value: {
                                    pass: false,
                                    message: function () { return "Expected [" + index + "] to be close to " + e + " but got " + a + ". Actual=" + actual; }
                                } };
                        }
                    };
                    for (var _i = 0, _a = expected.entries(); _i < _a.length; _i++) {
                        var _b = _a[_i], index = _b[0], e = _b[1];
                        var state_1 = _loop_1(index, e);
                        if (typeof state_1 === "object")
                            return state_1.value;
                    }
                    return { pass: true, message: "Ok!" };
                }
            };
        }
    });
});
// =======================================================================
function expectElem(x) {
    return expect(_.flattenDeep(x.elements));
}
exports.expectElem = expectElem;
// =======================================================================
function testScheduler() {
    return new testing_1.TestScheduler(function (actual, expected) {
        expect(actual).toEqual(expected);
    });
}
exports.testScheduler = testScheduler;
