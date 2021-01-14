import * as React from "react"
import {ReactElement} from "react"

export function ResponsiveView(props: {
  mobile: ReactElement,
  desktop: ReactElement
}) {

  const {width} = useWindowSize()
  const isMobile = width <= MAX_DEVICE_WIDTHS.mobile

  return isMobile ?
    props.mobile :
    props.desktop
}

export const MAX_DEVICE_WIDTHS = {
  mobile: 720,
}

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const handleResize = () => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  React.useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}
