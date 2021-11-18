import {Observable, Subject} from "rxjs";
import * as React from "react";
import {Context, generateId, useObserving} from "@piccollage/cbjs";
import {SnackbarOrigin} from "@material-ui/core";
import {useSnackbar} from "notistack";

export type SnackbarRequest = {
  message: string,
  variant?: "default" | "success" | "info" | "error" | "warning",
  key?: string,
  keyClose?: string,
  anchorOrigin?: SnackbarOrigin,
  autoHideDuration?: number,
  onClickDismiss?: () => any,
}

export function SnackbarView(props: {
  snackbar$: Observable<SnackbarRequest>
}) {

  // ---- Use notistack
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  // ---- Receive requests
  useObserving(props.snackbar$, request => {
    if (request.variant) {
      if (!request.key)
        request.key = generateId()
      if (request.keyClose)
        closeSnackbar(request.keyClose)    // Close previous with same key
      request.onClickDismiss = request.onClickDismiss || (() => {
        closeSnackbar(request.key)
      })
      request.anchorOrigin = request.anchorOrigin ||
        { horizontal: 'center', vertical: 'top' }
      enqueueSnackbar(request.message, { ...request })
    }
  })

  return (
    <div style={{display: "none"}} />
  )
}

// -------------------------------------------

export class SnackbarContext implements Context {
  snackbar$ = new Subject<SnackbarRequest>()
}