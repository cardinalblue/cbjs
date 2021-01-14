import {Point, Rect, Size} from "./kor";

export function korRectFromClientRect(rect: ClientRect): Rect {
  return new Rect(
    new Point(rect.left, rect.top),
    new Size(rect.right - rect.left, rect.bottom - rect.top)
  )
}


