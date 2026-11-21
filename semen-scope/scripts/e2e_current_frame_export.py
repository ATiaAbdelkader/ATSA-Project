import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iwvd519yvkeifos54o1zl-ceb6452e.us2.manus.computer"


def evaluate(socket, expression, message_id):
    socket.send(json.dumps({"id": message_id, "method": "Runtime.evaluate", "params": {"expression": expression, "returnByValue": True, "awaitPromise": True}}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            if "exceptionDetails" in response.get("result", {}):
                raise RuntimeError(response["result"]["exceptionDetails"].get("text", "Browser evaluation failed"))
            return response.get("result", {}).get("result", {}).get("value")


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    for message_id in range(2, 40):
        time.sleep(0.2)
        if evaluate(socket, "(() => { const video = document.querySelector('video.analysis-video'); const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes('Export current frame PNG') && !item.disabled); return Boolean(button && video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0); })()", message_id):
            break
    else:
        raise RuntimeError("Enabled current-frame export control did not render.")
    evaluate(socket, "(() => { const originalCreateObjectUrl = URL.createObjectURL.bind(URL); URL.createObjectURL = blob => { window.__semenScopeFrameBlob = blob; return originalCreateObjectUrl(blob); }; const originalClick = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function() { window.__semenScopeFrameExportName = this.download; return originalClick.call(this); }; })()", 41)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.includes('Export current frame PNG'))?.click()", 42)
    for message_id in range(43, 65):
        time.sleep(0.2)
        valid = evaluate(socket, "window.__semenScopeFrameBlob instanceof Blob && window.__semenScopeFrameBlob.type === 'image/png' && /-frame-[0-9]+ms\\.png$/.test(window.__semenScopeFrameExportName || '')", message_id)
        if valid:
            break
    else:
        raise RuntimeError("Browser-local PNG frame blob or safe export filename was not generated.")
    notice = evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.includes('Export current frame PNG'))?.title || ''", 66)
    if "not stored by SemenScope" not in notice or "not a diagnostic" not in notice:
        raise RuntimeError("Current-frame export technical-review safeguard did not render.")
    print(json.dumps({"current_frame_export": "complete", "browser_generated_png": True, "technical_only_notice": True}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Current-frame export validation failed: {error}", file=sys.stderr)
        sys.exit(1)
