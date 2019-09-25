"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var operators_1 = require("rxjs/operators");
var _ = __importStar(require("lodash"));
exports.BLANK = "";
// ----------------------------------------------------------------------------
// Debugging
function taplog(label) {
    var vars = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        vars[_i - 1] = arguments[_i];
    }
    return function (s) { return s.pipe(operators_1.tap(function (x) { return console.log.apply(console, __spreadArrays([label, x], vars)); })); };
}
exports.taplog = taplog;
function LOG(s, x) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    console.log.apply(console, __spreadArrays([s, x], args));
    return x;
}
exports.LOG = LOG;
function LOGTHRU() {
    var vars = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        vars[_i] = arguments[_i];
    }
    var f = null;
    if (vars.length > 0) {
        f = vars.pop();
    }
    console.log.apply(console, vars);
    if (f && typeof f === 'function') {
        return f();
    }
    return f;
}
exports.LOGTHRU = LOGTHRU;
// ----------------------------------------------------------------------------
// Object/Map
function subkeys(target) {
    var keys = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        keys[_i - 1] = arguments[_i];
    }
    return keys.reduce(function (out, k) {
        var _a;
        return (__assign(__assign({}, out), (_a = {}, _a[k] = target[k], _a)));
    }, {});
}
exports.subkeys = subkeys;
// ----------------------------------------------------------------------------
// Enumerable/Array
function compact(source) {
    return _.filter(source, function (x) { return x !== null && x !== undefined; });
}
exports.compact = compact;
function withoutFirst(a, t) {
    var x = _.findIndex(a, function (i) { return _.isEqual(i, t); });
    if (x < 0)
        return a;
    var r = __spreadArrays(a);
    r.splice(x, 1);
    return r;
}
exports.withoutFirst = withoutFirst;
function arrayRemove(array, f) {
    var index = array.findIndex(f);
    if (index >= 0) {
        array.splice(index, 1);
    }
    return array;
}
exports.arrayRemove = arrayRemove;
function isEmpty(array) {
    return array.length == 0;
}
exports.isEmpty = isEmpty;
function last(a) {
    if (a.length <= 0)
        return null;
    return a[a.length - 1];
}
exports.last = last;
function next(array, target) {
    var i = array.findIndex(function (t) { return target === t; });
    if (i < 0 || i >= array.length)
        return null;
    return array[i + 1];
}
exports.next = next;
// ----------------------------------------------------------------------------
// Map/Object
function mapmap(map, f) {
    var ret = {};
    for (var k in map) {
        ret[k] = f(map[k]);
    }
    return ret;
}
exports.mapmap = mapmap;
// ----------------------------------------------------------------------------
// Functional
function apply(t, f) {
    f(t).bind(t);
    return t;
}
exports.apply = apply;
function wiht(input, f) {
    return f(input);
}
exports.wiht = wiht;
function alos(input, f) {
    f(input);
    return input;
}
exports.alos = alos;
// ----------------------------------------------------------------------------
// String
function trim2(s) {
    return s.replace(/^[\s\0]+/, "")
        .replace(/[\s\0]+$/, "");
}
exports.trim2 = trim2;
function insertAt(s1, index, s2) {
    return s1.substr(0, index) + s2 + s1.substr(index);
}
exports.insertAt = insertAt;
function generateId() {
    return Math.random().toString(36).substring(2) +
        (new Date()).getTime().toString(36);
}
exports.generateId = generateId;
function rand(i) {
    return Math.floor(Math.random() * i);
}
exports.rand = rand;
function ifNumber(x, or) {
    if (_.isNumber(x))
        return x;
    else
        return or;
}
exports.ifNumber = ifNumber;
// ----------------------------------------------------------------------------
// DOM/React related
function isFocused(dom) {
    if (document.activeElement) {
        return (document.activeElement === dom);
    }
    return false;
}
exports.isFocused = isFocused;
var Queue = /** @class */ (function () {
    function Queue() {
        this.q = [];
        this.subscribers = [];
    }
    Queue.prototype.subscribe = function (subscriber) {
        var _this = this;
        this.subscribers.push(subscriber);
        this.resolve();
        return function () {
            arrayRemove(_this.subscribers, function (i) { return i === subscriber; });
        };
    };
    Queue.prototype.push = function (t) {
        this.q.push(t);
        this.resolve();
    };
    Queue.prototype.resolve = function () {
        var _this = this;
        this.q.forEach(function (t) {
            return _this.subscribers.forEach(function (s) { return s(t); });
        });
        this.q = [];
    };
    return Queue;
}());
exports.Queue = Queue;
// =======================================================================
var Range = /** @class */ (function () {
    function Range(index, length) {
        this.index = index;
        this.length = length;
    }
    return Range;
}());
exports.Range = Range;
