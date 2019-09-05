"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var contexter_1 = require("./contexter");
it('contexter works', function () {
    var ContextA = /** @class */ (function () {
        function ContextA(a, self) {
            this.a = a;
            this.self = self;
        }
        return ContextA;
    }());
    var ContextB = /** @class */ (function () {
        function ContextB(b, self) {
            this.b = b;
            this.self = self;
        }
        return ContextB;
    }());
    var ContextC = /** @class */ (function () {
        function ContextC(c, self) {
            this.c = c;
            this.self = self;
        }
        return ContextC;
    }());
    var Component1 = /** @class */ (function () {
        function Component1(name) {
            this.name = name;
            this.contexter = new contexter_1.Contexter(new ContextA('_A', this));
            this.children = this.contexter.children(function () { return [
                new Component2('LEFT'),
                new Component2('RIGHT'),
            ]; });
        }
        return Component1;
    }());
    var Component2 = /** @class */ (function () {
        function Component2(name) {
            this.name = name;
            this.contexter = new contexter_1.Contexter(new ContextB('contextB:' + name, this));
            this.children = this.contexter.children(function () { return [
                new Component3('LEFT'),
                new Component3('RIGHT'),
            ]; });
        }
        return Component2;
    }());
    var Component3 = /** @class */ (function () {
        function Component3(name) {
            this.name = name;
            this.contexter = new contexter_1.Contexter(new ContextC('contextC:' + name, this));
        }
        return Component3;
    }());
    var c1 = new Component1("1");
    expect(c1.contexter.get_(ContextA).a).toBe('_A');
    expect(c1.children[0].contexter.get_(ContextA).a).toBe('_A');
    expect(c1.children[0].contexter.get_(ContextB).b).toBe('contextB:LEFT');
    expect(c1.children[1].contexter.get_(ContextA).a).toBe('_A');
    expect(c1.children[1].contexter.get_(ContextB).b).toBe('contextB:RIGHT');
    expect(c1.children[0].children[0].contexter.get_(ContextA).a).toBe('_A');
    expect(c1.children[0].children[1].contexter.get_(ContextA).a).toBe('_A');
    expect(c1.children[0].children[0].contexter.get_(ContextB).b).toBe('contextB:LEFT');
    expect(c1.children[0].children[1].contexter.get_(ContextB).b).toBe('contextB:LEFT');
    expect(c1.children[0].children[0].contexter.get_(ContextC).c).toBe('contextC:LEFT');
    expect(c1.children[0].children[1].contexter.get_(ContextC).c).toBe('contextC:RIGHT');
    expect(c1.children[1].children[0].contexter.get_(ContextA).a).toBe('_A');
    expect(c1.children[1].children[1].contexter.get_(ContextA).a).toBe('_A');
    expect(c1.children[1].children[0].contexter.get_(ContextB).b).toBe('contextB:RIGHT');
    expect(c1.children[1].children[1].contexter.get_(ContextB).b).toBe('contextB:RIGHT');
    expect(c1.children[1].children[0].contexter.get_(ContextC).c).toBe('contextC:LEFT');
    expect(c1.children[1].children[1].contexter.get_(ContextC).c).toBe('contextC:RIGHT');
});
