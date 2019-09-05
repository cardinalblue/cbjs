"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
function extractInput(input) {
    var current = input.current;
    if (current instanceof HTMLElement)
        input = current;
    if (input instanceof HTMLElement)
        input = input.innerText;
    if (typeof input === "string")
        return input;
    return null;
}
var InputStreamer = /** @class */ (function () {
    function InputStreamer() {
        // ---- Output
        this.stream$ = new rxjs_1.Subject();
        this.cur$ = null;
    }
    // ---- Public interface
    InputStreamer.prototype.onStart = function () {
        this.start$();
    };
    InputStreamer.prototype.onInput = function (input) {
        var i = extractInput(input);
        if (i !== null)
            this.start$().next(i);
    };
    InputStreamer.prototype.onStop = function () {
        if (this.cur$)
            this.cur$.complete();
        this.cur$ = null;
    };
    InputStreamer.prototype.onSpecialKey = function (input, key) {
        var i = extractInput(input);
        if (key === 'Enter') {
            console.log(">>>> InputStreamer ENTER");
            this.onInput((i || "") + '\0');
            return true;
        }
        else if (key === 'Tab') {
            console.log(">>>> InputStreamer TAB");
            this.onInput((i || "") + '\t');
            return true;
        }
        return false;
    };
    InputStreamer.prototype.start$ = function () {
        if (this.cur$ === null) {
            this.cur$ = new rxjs_1.ReplaySubject();
            this.stream$.next(this.cur$);
        }
        return this.cur$;
    };
    return InputStreamer;
}());
exports.InputStreamer = InputStreamer;
