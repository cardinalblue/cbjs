"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var Domainer = /** @class */ (function () {
    function Domainer() {
        this.shutdown$ = new rxjs_1.Subject();
    }
    Domainer.prototype.triggering = function (trigger$, manipulator, monad) {
        if (monad === void 0) { monad = operators_1.switchMap; }
        return trigger$.pipe(operators_1.takeUntil(this.shutdown$), monad(manipulator)).subscribe();
    };
    Domainer.prototype.connecting = function (source, destination) {
        return source.pipe(operators_1.takeUntil(this.shutdown$), operators_1.tap(function (t) { return destination.next(t); })).subscribe();
    };
    return Domainer;
}());
exports.Domainer = Domainer;
