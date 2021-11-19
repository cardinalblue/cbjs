import {BehaviorSubject} from "rxjs";
import {map} from "rxjs/operators";
import {Widget} from "../../widget"
import {filterDefined} from "../../util_rx"
import {TypeMapRegistry} from "../../type_map_registry"
import {Accessible} from "../../persons"
import {Manipulator} from "../../manipulators"
import {Context} from "../../contexter"
import {Size} from "../../kor"

export type TopWidget = Widget & Accessible;

export class AppContext implements Context {
  constructor(readonly appWidget: AppWidget) {}
}

export class AppWidget extends Widget {

  // ---- Subwidgets
  topWidget$ = new BehaviorSubject<TopWidget|null>(null)

  // ---- View inputs
  viewSize$ = new BehaviorSubject<Size|null>(null)

  // ---- Path
  path$ = new BehaviorSubject<string|null>(null)
  pathFromWidgetRegistry    = new TypeMapRegistry<TopWidget, string>()
  pathToManipulatorRegistry = new Map<RegExp, (pathCaptures: string[]) => Manipulator<any>>()

  // ---- Outputs
  bulletin$  = new BehaviorSubject<string|null>(null)

  constructor() {
    super();
    console.log("++++ AppWidget")

    // ---- Setup context
    this.contexter.prepend(new AppContext(this));

    // ---- Connect
    this.registerPaths()
    this.connectPath()
  }

  // ---- Apps should override this
  registerPaths() {
    console.log("++++ AppWidget registerPaths")
  }

  // ---- Connections
  connectPath() {

    // ---- Set path from TopWidget
    this.connecting(
      this.topWidget$.pipe(
        map(topWidget => {
          const path = topWidget && this.pathFromWidgetRegistry.map(topWidget)
          console.log("++++ AppWidget path from widget", topWidget, path)
          return path
        }),
        filterDefined(),
      ),
      this.path$
    )

    // ---- Trigger navigation of TopWidget from path
    this.triggering(
      this.path$.pipe(
        filterDefined(),
        map(path => {
          const manipulator = this.pathToManipulator(path)
          console.log("++++ AppWidget manipulator from path", manipulator, path)
          return manipulator
        }),
        filterDefined(),
      ),
      manipulator => manipulator,
    )

  }

  // ---- Utility
  private pathToManipulator(path: string): Manipulator<any>|undefined {
    for (const [regex, manipulatorF] of this.pathToManipulatorRegistry) {
      const m = path.match(regex)
      if (m) {
        console.log("++++ pathToManipulator regex match!", regex)
        return manipulatorF(m)
      }
    }
  }
}
