import {Point, Size} from "./kor"

export function fieldToString<D>(field: any, _default: D): string | D {
  if (typeof field == "string")
    return field
  return _default
}

function fieldToPoint<D>(field: any, _default: D)
  : Point | D {
  if (field instanceof Array
    && field.length === 2
    && typeof field[0] === "number" && _.isFinite(field[0])
    && typeof field[1] === "number" && _.isFinite(field[1])
  ) {
    return new Point(
      field[0],
      field[1]
    )
  }
  return _default
}

export function fieldToSize<D>(field: any, _default: D)
  : Size | D {
  const point = fieldToPoint(field, null)
  if (point) {
    return new Size(point.x, point.y);
  }
  return _default
}

export function fieldToNumber<D>(field: any, _default: D)
  : number | D {
  if (typeof field == "number" && _.isFinite(field))
    return field
  return _default
}

