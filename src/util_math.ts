import {normalizeRotation, Point, Rect, Size} from './kor'

export function generateTimestamp(): number {
  return (new Date()).valueOf() * 1000000 + Math.random() * 1000000
}

export function calculateTransformFromVectors2(pivot: Point,
                                               v1: Point[],
                                               v2: Point[])
  : { move: Point, rotate: number, scale: number }|null
{
  if (v1.length < 2 || v2.length < 2) {
    console.log('ERROR: calculateTransformFromVectors incorrect vectors', v1, v2)
    return null
  }
  const vn1: Point = v1[1].subtract(v1[0])
  const vn2: Point = v2[1].subtract(v2[0])
  // Calculate transform
  const rotate = vn1.angleTo(vn2)
  const scale  = Math.sqrt(vn2.magnitude2() / vn1.magnitude2())
  // Calculate displacement
  const vp = pivot.subtract(v1[0]);          // vector to pivot
  const vd = vp.rotate(rotate).scale(scale); // transformed vector
  const p2 = v2[0].add(vd);                  // new pivot
  const move = p2.subtract(pivot)
  return { move, rotate, scale }
}

export function convertPointFromBoundingBox(fromP: Point, fromRect: Rect,
                                            toRotation: number, toSize: Size)
  : Point
{
  const diag  = toSize as Point
  const diagR = Math.atan2(toSize.height, toSize.width)
  const toR   = normalizeRotation(toRotation)
  const cross = diag.rotate(toR)
  let scale
  if ((toR % Math.PI) < Math.PI/2) {
    const crossL = Math.abs(Math.sin(toR + diagR)) * cross.magnitude()
    scale = fromRect.size.height / crossL
  }
  else {
    const crossL = Math.abs(Math.cos(toR + diagR)) * cross.magnitude()
    scale = fromRect.size.width / crossL
  }

  // ---- Process the point
  const pCenter  = fromP.subtract(fromRect.center)
  const pRotated = pCenter.rotate(-toR).scale(1/scale)  // Unrotate and unscale

  return toSize.center().add(pRotated)

}

// ==========================================================================

export function btap(...args: any[]) {
  console.log(...args)
  return true
}

export function bflip<T>(f: (t: T) => boolean): (t: T) => boolean {
  return (t: T) => !f(t)
}

export function safeKey(obj: any, key: string) {
  return ((typeof obj === 'object') || undefined)
    && (key in obj || undefined)
    && obj[key]
}

