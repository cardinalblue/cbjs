import svgPath from "svgpath"

// ---- since library doesn't provide
export interface SvgPath {
  (path: string): SvgPath;
  new (path: string): SvgPath;
  abs(): SvgPath;
  from(path: string|SvgPath): SvgPath
  scale(sx: number, sy?: number): SvgPath;
  translate(x: number, y?: number): SvgPath;
  rotate(angle: number, rx?: number, ry?: number): SvgPath;
  skewX(degrees: number): SvgPath;
  skewY(degrees: number): SvgPath;
  matrix(m: number[]): SvgPath;
  transform(str: string): SvgPath;
  unshort(): SvgPath;
  unarc(): SvgPath;
  toString(): string;
  round(precision: number): SvgPath;
  iterate(iterator: (segment: any[], index: number, x: number, y: number) => void, keepLazyStack?: boolean): SvgPath;
}

function svgpath_from(source: SvgPath|string) {
  return (svgPath as any).from(source)
  // Workaround to bug with svgpath package TypeScript definition
}

// ---- Immutable SvgPath Wrapper
export class iSvgPath {
  private readonly _svgPath: SvgPath

  constructor(path: string|SvgPath) {
    this._svgPath = svgpath_from(path)
  }

  toString() {
    return this._svgPath.toString()
  }

  modify(f: (svgPath: SvgPath) => SvgPath) {
    const i = this.inner()
    return new iSvgPath(f(i))
  }
  private inner() {
    return svgpath_from(this._svgPath)
  }
}
