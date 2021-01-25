import {Point, Rect, Size} from "./kor";

export function korRectFromClientRect(rect: ClientRect): Rect {
  return new Rect(
    new Point(rect.left, rect.top),
    new Size(rect.right - rect.left, rect.bottom - rect.top)
  )
}

export function scaleHeight(size: Size, height: number) {
  return scaleDimension(size, height, true)
}

export function scaleWidth(size: Size, width: number) {
  return scaleDimension(size, width, false)
}

export function scaleMin(size: Size, dimension: number) {
  return scaleDimension(size, dimension, Math.min(size.width, size.height) === size.height)
}

function scaleDimension (size: Size, dimension: number, fitHeight: boolean = true): Size {
  return size.scale(
    fitHeight ?
      dimension / size.y :
      dimension / size.x
  )
}
