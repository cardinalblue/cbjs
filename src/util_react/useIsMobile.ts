import {MAX_DEVICE_WIDTHS, useWindowSize} from "./responsive_view";

export const useIsMobile = () =>
  useWindowSize().width <= MAX_DEVICE_WIDTHS.mobile
