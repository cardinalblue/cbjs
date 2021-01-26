import {Point, Rect, Size} from "./kor";

export function korRectFromClientRect(rect: ClientRect): Rect {
  return new Rect(
    new Point(rect.left, rect.top),
    new Size(rect.right - rect.left, rect.bottom - rect.top)
  )
}

export function scaleHeight(size: Size, height: number) {
  return size.scale(height/size.height)
}

export function scaleWidth(size: Size, width: number) {
  return size.scale(width/size.width)
}

export function scaleMin(size: Size, dimension: number) {
  return size.width < size.height ?
    scaleWidth(size, dimension) : scaleHeight(size, dimension)
}
