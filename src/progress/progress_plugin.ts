import {BehaviorSubject, Observable} from "rxjs";
import {ProgressWidget} from "./progress_widget";
import {finalize, map} from "rxjs/operators";
import {arraySubjectAdd, arraySubjectRemove} from "../util_array_rx"
import {TrackWhen} from "../manipulators"
import {doOnSubscribe} from "../util_rx"
import {ContextedDomainer} from "../contexted_domainer"
import {Point} from "../kor"

export class ProgressPlugin extends ContextedDomainer {

  progressWidgets$ = new BehaviorSubject<ProgressWidget[]>([])

  manageProgressWidget(point: Point)

    : [() => any, () => any] {
    let progressWidget: ProgressWidget | null = null

    const self = this

    function doStart() {
      if (!progressWidget) {
        progressWidget = self.legate(() => new ProgressWidget(point))
        arraySubjectAdd(self.progressWidgets$, progressWidget)
      }
    }

    function doStop() {
      // We remove the widget when the first data happens
      if (progressWidget)
        arraySubjectRemove(self.progressWidgets$, progressWidget)
    }

    return [doStart, doStop]
  }

  observingProgressWidget<T>(point: Point,
                             trackWhen: TrackWhen = TrackWhen.Subscribed)
    : (source: Observable<T>) => Observable<T> {

    return (source: Observable<T>) => {
      const [doStart, doStop] = this.manageProgressWidget(point)
      return source.pipe(
        doOnSubscribe(() => {
          if (trackWhen === TrackWhen.Subscribed)
            doStart()
        }),
        map((_, index) => {
          if (trackWhen === TrackWhen.First && index === 0)
            doStart()
          return _
        }),
        finalize(doStop)
      )
    }
  }

}
