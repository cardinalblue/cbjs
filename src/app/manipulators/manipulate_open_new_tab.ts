import {defer, EMPTY} from "rxjs";
import {AppContext} from "../ui/app_widget"
import {Widget} from "../../widget"

export function manipulateOpenNewTab(topWidget: Widget) {

  // ---- Calculate new path from widget and navigate browser it
  return defer(() => {
    const appWidget = topWidget.contexter.use(AppContext).appWidget
    const path = appWidget.pathFromWidgetRegistry.map(topWidget)
    console.log("++++ manipulateOpenNewTab path", path)
    if (path)
      window.open(path, '_blank', 'noopener,noreferrer')?.focus()
    return EMPTY
  })
}