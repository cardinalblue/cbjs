import React, {useEffect, useRef} from 'react'
import {LoginWidget} from "./login_widget"
import {firebaseLoginStart$} from "../firebaseAuth"
import 'firebaseui/dist/firebaseui.css'

export const LoginView = React.memo((props: { widget: LoginWidget }) => {
  console.log('++++ LoginView render')

  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const e = ref.current
    if (e) {
      const request = props.widget.loginRequest
      const subs = firebaseLoginStart$(e).subscribe(request.firebaseUser$)
      return () => subs.unsubscribe()
    }
  })
  return (
    <div ref={ref}>
    </div>
  )
})

