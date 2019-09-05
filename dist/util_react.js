"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
// ----------------------------------------------------------------
// Custom React Hooks to help with RxJS
function useObservable(observable, defaultValue, inputs) {
    if (inputs === void 0) { inputs = [observable]; }
    var _a = react_1.useState(defaultValue), t = _a[0], setT = _a[1];
    react_1.useEffect(function () {
        var subs = observable.subscribe(function (t) {
            setT(t);
        });
        return function () { return subs.unsubscribe(); };
    }, inputs);
    return t;
}
exports.useObservable = useObservable;
function useBehaviorSubject(subject) {
    var _a = react_1.useState(subject.value), t = _a[0], setT = _a[1];
    react_1.useEffect(function () {
        var subs = subject.subscribe(function (t) {
            setT(t);
        });
        return function () { return subs.unsubscribe(); };
    }, [subject]);
    return t;
}
exports.useBehaviorSubject = useBehaviorSubject;
function useObserving(observable, callback, inputs) {
    if (inputs === void 0) { inputs = [observable]; }
    react_1.useEffect(function () {
        var subs = observable.subscribe(callback);
        return function () { return subs.unsubscribe(); };
    }, [observable]);
}
exports.useObserving = useObserving;
// -----------------------------------------------------------------------
// Focuses the given element whenever a `true` gets sent on the given Queue.
// Blurs if `false` is sent.
function useFocusing(ref, doFocus) {
    react_1.useEffect(function () {
        return doFocus.subscribe(function (focus) {
            return ref.current &&
                (focus ?
                    ref.current.focus() :
                    ref.current.blur());
        });
    });
}
exports.useFocusing = useFocusing;
