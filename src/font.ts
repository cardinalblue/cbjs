export enum FontProtocol {
  web     = "web",
  google  = "google",
  storage = "storage",
}

export class Font {
  constructor(readonly family: string,
              readonly title: string = family,
              readonly protocol: FontProtocol = FontProtocol.storage,
              readonly variation: string|null = null,
              readonly url: string|null = null
              ) {}
  isEqual(other: any) {
    return (other instanceof Font) && (this.family === other.family)
  }
}


