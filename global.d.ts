
// ---- Declare properties on window and other JS globals
export {};
declare global {
  interface Window {
    FB: any
    mobileAndTabletcheck: any
    opera: any
  }
  interface Navigator {
    vendor?: any
    userAgent?: any
  }
}
