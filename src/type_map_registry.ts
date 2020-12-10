export type Constructor<T> = new (...args: any[]) => T

export class TypeMapRegistry<K, V> {
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