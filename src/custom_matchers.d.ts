declare namespace jest {
  interface Matchers<R, T> {
    toBeEnumerableCloseTo(
      expected: any
    ): { pass: boolean; message: () => string };
  }
}
