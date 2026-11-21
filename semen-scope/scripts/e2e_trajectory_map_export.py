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
    for message_id in range(2, 30):
        time.sleep(0.2)
        if evaluate(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'))", message_id):
            break
    else:
        raise RuntimeError("Run analysis control did not render.")
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis')?.click()", 30)
    for message_id in range(31, 260):
        time.sleep(0.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        if "Analysis complete — review required" in text:
            break
        if "Analysis could not complete" in text:
            raise RuntimeError("Reference analysis failed before trajectory-map export.")
    else:
        raise RuntimeError("Reference analysis did not complete within the timeout.")
    evaluate(socket, "(() => { const original = URL.createObjectURL.bind(URL); URL.createObjectURL = blob => { if (blob.type === 'image/png') window.__semenScopeMapPngBlob = blob; return original(blob); }; const originalClick = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function() { if (this.download?.endsWith('-trajectory-map.png')) window.__semenScopeMapPngName = this.download; return originalClick.call(this); }; })()", 261)
    clicked = evaluate(socket, "(() => { const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes('Export map PNG') && !item.disabled); if (!button || !document.querySelector('.map-canvas svg.trajectory-map')) return false; button.click(); return true; })()", 262)
    if not clicked:
        raise RuntimeError("Enabled map PNG export control or trajectory SVG did not render.")
    for message_id in range(263, 293):
        time.sleep(0.2)
        valid = evaluate(socket, "window.__semenScopeMapPngBlob instanceof Blob && window.__semenScopeMapPngBlob.type === 'image/png' && /-trajectory-map\\.png$/.test(window.__semenScopeMapPngName || '')", message_id)
        if valid:
            break
    else:
        raise RuntimeError("Browser-local trajectory-map PNG blob or safe export filename was not generated.")
    notice = evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.includes('Export map PNG'))?.title || ''", 294)
    if "not stored by SemenScope" not in notice or "does not change trajectories" not in notice:
        raise RuntimeError("Trajectory-map technical-review safeguard did not render.")
    print(json.dumps({"trajectory_map_export": "complete", "browser_generated_png": True, "technical_only_notice": True}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Trajectory-map export validation failed: {error}", file=sys.stderr)
        sys.exit(1)
