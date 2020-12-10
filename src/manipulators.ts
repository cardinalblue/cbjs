import {Observable} from "rxjs"

export type Manipulator<T> = Observable<T>

export enum TrackWhen {
  Subscribed,
  First
}

