import {defer, of, throwError} from "rxjs";
import copy from "clipboard-copy";
import {AppContext} from "../ui/app_widget"
import {Widget} from "../../widget"
import {Manipulator} from "../../manipulators"

export function manipulateCopyLinkTo(topWidget: Widget)
  : Manipulator<string> {
  // ---- Calculate new path from widget and navigate browser it
  return defer(() => {

    const appWidget = topWidget.contexter.use(AppContext).appWidget

    const path = appWidget.pathFromWidgetRegistry.map(topWidget)
    if (!path)
      return throwError("unable to get path")

    const url = new URL(window.location.href)
    const fullpath = `${url.origin}${path}`

    copy(fullpath)

    return of(fullpath)
  })

  // ----
}
