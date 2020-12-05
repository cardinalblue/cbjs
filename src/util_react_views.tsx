import * as React from "react";
import {CSSProperties} from "react";

export function OptionalDiv(props: {  opt?: boolean,
  children?: any,
  style?: CSSProperties,
  className?: string })
{
  if (!props.opt)
    return props.children
  else
    return (
      <div style={props.style} className={props.className}>
        { props.children }
      </div>
    )
}

