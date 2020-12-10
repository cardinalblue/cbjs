export class Color {
  static TRANSPARENT = new Color('transparent')
  static BLACK = new Color('#000000')

  constructor(readonly code: string) {}

  isEqual(other: any) {
    return (other instanceof Color) && other.code === this.code
  }
}