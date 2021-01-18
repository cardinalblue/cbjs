import {Point, Rect, Size} from "./kor";

export function korRectFromClientRect(rect: ClientRect): Rect {
  return new Rect(
    new Point(rect.left, rect.top),
    new Size(rect.right - rect.left, rect.bottom - rect.top)
  )
}

export function aspectFit (size: Size, dim: number, fitHeight: boolean = true): Size {
  const ratio = size.x / size.y

  if (fitHeight)
    return ratio < 1 ?
      new Size(dim * ratio, dim) : new Size(dim, dim / ratio)
  return ratio > 1 ?
    new Size(dim, dim / ratio) : new Size(dim, dim / ratio)
}

