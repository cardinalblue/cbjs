import React, {CSSProperties} from "react"
import {ProgressWidget} from "./progress_widget";
import {CircularProgress} from "@material-ui/core";

export function ProgressView(props: { progressWidget: ProgressWidget, size?: number })
{

  const size = props.size || 80
  const style: CSSProperties = {
    position: "absolute",
    zIndex: 5000,
    transform: "translate(-50%,-50%)",
    left: props.progressWidget.point.x,
    top:  props.progressWidget.point.y,
  }
  return (
    <div style={style} >
      <CircularProgress size={size} color={"secondary"}/>
    </div>
  )
}
