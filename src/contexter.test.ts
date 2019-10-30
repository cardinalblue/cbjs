import {Contexter} from "./contexter"

it ('contexter works', () => {
  class ContextA {
    constructor(readonly a: string, readonly self: Object) {}
  }
  class ContextB {
    constructor(readonly b: string, readonly self: Object) {}
  }
  class ContextC {
    constructor(readonly c: string, readonly self: Object) {}
  }

  class Component1 {
    contexter = new Contexter(new ContextA('_A', this))
    children: Component2[]
    constructor(readonly name: string) {
      this.children = this.contexter.children(() => [
        new Component2('LEFT'),
        new Component2('RIGHT'),
      ])
    }
  }

  class Component2 {
    contexter: Contexter
    children: Component3[]
    constructor(readonly name: string) {
      this.contexter = new Contexter(new ContextB('contextB:' + name, this))
      this.children = this.contexter.children(() => [
        new Component3('LEFT'),
        new Component3('RIGHT'),
      ])
    }
  }

  class Component3 {
    contexter: Contexter
    constructor(readonly name: string) {
      this.contexter = new Contexter(new ContextC('contextC:' + name, this))
    }
  }

  const c1 = new Component1("1")
  expect(c1.contexter.use(ContextA).a).toBe('_A')

  expect(c1.children[0].contexter.use(ContextA).a).toBe('_A')
  expect(c1.children[0].contexter.use(ContextB).b).toBe('contextB:LEFT')
  expect(c1.children[1].contexter.use(ContextA).a).toBe('_A')
  expect(c1.children[1].contexter.use(ContextB).b).toBe('contextB:RIGHT')

  expect(c1.children[0].children[0].contexter.use(ContextA).a).toBe('_A')
  expect(c1.children[0].children[1].contexter.use(ContextA).a).toBe('_A')
  expect(c1.children[0].children[0].contexter.use(ContextB).b).toBe('contextB:LEFT')
  expect(c1.children[0].children[1].contexter.use(ContextB).b).toBe('contextB:LEFT')
  expect(c1.children[0].children[0].contexter.use(ContextC).c).toBe('contextC:LEFT')
  expect(c1.children[0].children[1].contexter.use(ContextC).c).toBe('contextC:RIGHT')
  expect(c1.children[1].children[0].contexter.use(ContextA).a).toBe('_A')
  expect(c1.children[1].children[1].contexter.use(ContextA).a).toBe('_A')
  expect(c1.children[1].children[0].contexter.use(ContextB).b).toBe('contextB:RIGHT')
  expect(c1.children[1].children[1].contexter.use(ContextB).b).toBe('contextB:RIGHT')
  expect(c1.children[1].children[0].contexter.use(ContextC).c).toBe('contextC:LEFT')
  expect(c1.children[1].children[1].contexter.use(ContextC).c).toBe('contextC:RIGHT')

})