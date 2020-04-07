declare namespace jest {
  interface Matchers<T> {
    toBeEnumerableCloseTo(
      expected: any
    ): { pass: boolean; message: () => string };
  }
}
