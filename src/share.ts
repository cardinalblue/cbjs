function forceDownload(blob: string, filename: string) {
  var a = document.createElement("a");
  a.download = filename;
  a.href = blob;
  console.log({ a });
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadResource(url: string, filename: string) {
  fetch(url, {
    headers: new Headers({
      Origin: window.location.origin
    }),
    mode: "cors"
  })
    .then(response => {
      return response.blob();
    })
    .then(blob => {
      let blobUrl = window.URL.createObjectURL(blob);
      forceDownload(blobUrl, filename);
    })
    .catch(e => console.error(e));
}
