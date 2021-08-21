/**
 * @deprecated Use a better supported library such as https://www.npmjs.com/package/color
 */
export class Color {
  static TRANSPARENT = new Color('transparent')
  static BLACK = new Color('#000000')

  constructor(readonly code: string) {}

  isEqual(other: any) {
    return (other instanceof Color) && other.code === this.code
  }
}