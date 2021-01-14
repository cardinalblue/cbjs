import * as React from 'react'
import {BaseAnimation, IAnimation} from "./animatorer";
import {Motion, PlainStyle, spring, Style} from "react-motion"


function springizeMotionable(motionable: PlainStyle): Style {
  const s: Style = {}
  let k: keyof PlainStyle
  for (k in motionable) {
    const v = motionable[k]
    if (typeof v === 'number')
      s[k] = spring(v)
  }
  return s
}

function unitF(x: any): any  { return x; }

export function animationToMotion<T>(
  tStart: T,
  animation: IAnimation<T>,
  toStyle: ((t: T) => PlainStyle) = unitF,
  fromStyle: ((style: PlainStyle) => T) = unitF,
  component: ((tMotion: T) => React.ReactElement)
)
  : React.ReactElement {

  if (animation instanceof BaseAnimation) {
    const tTo = animation.valueTo(tStart)
    if (animation.t === 0) {
      // Short circuit, skip Motion if instant Animation
      return component(tTo)
    }
    else {
      const styleStart  = toStyle(tStart)
      const styleTo     = toStyle(tTo)
      const styleMotion = springizeMotionable(styleTo)
      return (
        <Motion defaultStyle={styleStart} style={styleMotion}>
          {(motion: PlainStyle) => component(fromStyle(motion))}
        </Motion>
      )
    }
  }
  else {
    return (
      component(tStart)
    )
  }
}

