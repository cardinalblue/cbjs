
export type Constructable = abstract new(...args: any[]) => any
export type Constructor<T extends Constructable> = new (...args: ConstructorParameters<T>) => T

export class TypeMapRegistry<K extends Constructable, V> {
  private _map: Map<Constructor<K>, (k: K) => V> = new Map()

  register<KSUB extends K>(k: Constructor<KSUB>, vf: (k: KSUB) => V) {
    this._map.set(k, vf as (k: K) => V)
  }

  map(k: K): V | undefined {
    for (const [konstructor, vf] of this._map) {
      if (k instanceof konstructor)
        return vf(k)
    }
  }
}