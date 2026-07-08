const ONNXRUNTIME_WEB_VERSION = '1.22.0';
const ONNXRUNTIME_WEB_CDN_BASE_URL = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ONNXRUNTIME_WEB_VERSION}/dist/`;
const ONNXRUNTIME_WEB_CDN_URL = `${ONNXRUNTIME_WEB_CDN_BASE_URL}ort.bundle.min.mjs`;

let ortPromise = null;

export async function loadOnnxRuntime() {
  if (!ortPromise) {
    ortPromise = import(/* @vite-ignore */ ONNXRUNTIME_WEB_CDN_URL).then((ort) => {
      ort.env.wasm.wasmPaths = ONNXRUNTIME_WEB_CDN_BASE_URL;
      return ort;
    });
  }

  return ortPromise;
}
