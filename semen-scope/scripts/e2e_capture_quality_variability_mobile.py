import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer"


def command(socket, method, params, message_id):
    socket.send(json.dumps({"id": message_id, "method": method, "params": params}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            if "error" in response:
                raise RuntimeError(response["error"].get("message", "DevTools command failed"))
            return response.get("result", {})


def evaluate(socket, expression, message_id):
    return command(socket, "Runtime.evaluate", {"expression": expression, "returnByValue": True, "awaitPromise": True}, message_id).get("result", {}).get("value")


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, 1)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 2)
    for message_id in range(3, 32):
        time.sleep(0.2)
        if evaluate(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'))", message_id):
            break
    else:
        raise RuntimeError("Run analysis control did not render at mobile width.")
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis')?.click()", 32)
    for message_id in range(33, 330):
        time.sleep(0.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        if "Analysis complete — review required" in text:
            break
        if "Analysis could not complete" in text:
            raise RuntimeError("Mobile analysis failed before capture-quality variability validation.")
    else:
        raise RuntimeError("Mobile analysis did not complete within the timeout.")
    responsive = evaluate(socket, "(() => { const panel = document.querySelector('.capture-quality-variability'); const grid = document.querySelector('.capture-quality-variability-grid'); const styles = grid && getComputedStyle(grid); return Boolean(panel && grid && styles) && panel.getBoundingClientRect().width <= 375 && grid.children.length === 4 && styles.gridTemplateColumns.split(' ').length === 2 && document.body.innerText.includes('Sampled frame dispersion'); })()", 331)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, 332)
    if not responsive:
        raise RuntimeError("Capture-quality variability evidence panel was not readable at mobile width.")
    print(json.dumps({"capture_quality_variability_mobile": "complete", "responsive": responsive}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Mobile capture-quality variability validation failed: {error}", file=sys.stderr)
        sys.exit(1)
