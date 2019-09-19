"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var lodash_1 = __importDefault(require("lodash"));
var Contexter = /** @class */ (function () {
    function Contexter() {
        var contexts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            contexts[_i] = arguments[_i];
        }
        this.contexts = __spreadArrays((util_1.last(Contexter.curContexts) || []), contexts);
    }
    Contexter.prototype.children = function (block) {
        Contexter.curContexts.push(this.contexts);
        var r = block();
        Contexter.curContexts.pop();
        return r;
    };
    Contexter.prototype.has = function (contextType) {
        return lodash_1.default.findIndex(this.contexts, function (c) { return c instanceof contextType; }) >= 0;
    };
    Contexter.prototype.get = function (contextType) {
        var found = lodash_1.default.findLast(this.contexts, function (c) { return c instanceof contextType; });
        return found || null;
    };
    Contexter.prototype.get_ = function (contextType) {
        var c = this.get(contextType);
        if (!c)
            throw Error("Context " + contextType + " not set");
        return c;
    };
    Contexter.prototype.prepend = function (contexts) {
        var c = (contexts instanceof Contexter) ? contexts.contexts :
            (contexts instanceof Array) ? contexts :
                [contexts];
        this.contexts = __spreadArrays(c, this.contexts);
    };
    Contexter.curContexts = [];
    return Contexter;
}());
exports.Contexter = Contexter;
// -----------------------------------------------------------------
// Usage example:
var MyContextType = /** @class */ (function () {
    function MyContextType(s) {
        this.s = s;
    }
    return MyContextType;
}());
var X = /** @class */ (function () {
    function X() {
        this.contexter = new Contexter(); // Gets the context from the stack
    }
    X.prototype.someMethod = function () {
        // Creating children that will get passed on the Context
        this.contexter.children(function () {
            // Code that creates children, will automatically get a copy of parent contexts
        });
        // Reading the Context
        var c = this.contexter.get(MyContextType);
    };
    return X;
}());
