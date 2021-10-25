import {Constructable} from "./util"

export class TypeMapRegistry<K, V> {
  private _map: Map<Constructable<K>, (k: K) => V> = new Map()

  register<KSUB extends K>(k: Constructable<KSUB>, vf: (k: KSUB) => V) {
    this._map.set(k, vf as (k: K) => V)
  }

  map(k: K): V | undefined {
    for (const [key, vf] of this._map) {
      if (k instanceof key)
        return vf(k)
    }
  }
}