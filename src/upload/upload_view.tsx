import * as React from "react"
import {useEffect, useRef} from "react"
import {UploadWidget} from "./upload_widget"

export function UploadView(props: { uploadWidget: UploadWidget }) {

  const ref = useRef<HTMLInputElement>(null)

  function filesSelected(fileList: FileList) {
    console.log("++++ UploadView onFiles", fileList)
    const fileArray = []
    for (let i=0; i<fileList.length; i++)
      fileArray[i] = fileList[i]
    props.uploadWidget.files$.next(fileArray)
  }
  function filesFinished(this: GlobalEventHandlers, e: FocusEvent) {
    console.log("++++ UploadView onBlur")
    // Hack! wait until possibly the `onFile` handler happens
    setTimeout(() =>
      props.uploadWidget.files$.complete(),
      500)
  }
  // Note that there are situations (particularly in mobile devices)
  // in which it is not possible to detect the closing of the file dialog,
  // so the UI/manipulator cannot assume that the `uploadWidget.file$` will
  // be completed.

  // Automatically open the dialog.
  // Close it when focus goes back.
  //
  useEffect(() => {

    // ---- Activate the file dialog
    if (!props.uploadWidget.opened) {
      console.log("++++ UploadView useEffect opening")
      ref.current && ref.current.click()
      props.uploadWidget.opened = true
    }

    // ---- Save the previous handler
    const onfocusPrev = document ? document.body.onfocus : null
    if (document)
      document.body.onfocus = filesFinished

    // ---- Restore the previous handler
    return () => {
      if (document)
        document.body.onfocus = onfocusPrev
    }
  })
  return (
    <input multiple type="file" accept=".jpg,.png,.tiff,.bmp,.gif" ref={ref} style={{display: "none"}}
           onChange={e => {
             console.log("++++ UploadView onChange", e)
             e.target && e.target.files && filesSelected(e.target.files)
           } }
           onClick={(e) => e.stopPropagation()}/>

  )
}