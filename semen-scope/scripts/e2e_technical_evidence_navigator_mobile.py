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
    for message_id in range(33, 300):
        time.sleep(0.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        if "Analysis complete — review required" in text:
            break
        if "Analysis could not complete" in text:
            raise RuntimeError("Mobile analysis failed before technical-evidence navigation validation.")
    else:
        raise RuntimeError("Mobile analysis did not complete within the timeout.")
    responsive = evaluate(socket, "(() => { const nav = document.querySelector('.technical-evidence-navigator'); const actions = document.querySelector('.technical-evidence-nav-actions'); const styles = actions && getComputedStyle(actions); return Boolean(nav && actions && styles) && nav.getBoundingClientRect().width <= 375 && actions.children.length === 5 && styles.overflowX === 'auto' && document.body.innerText.includes('TECHNICAL EVIDENCE INDEX'); })()", 301)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, 302)
    if not responsive:
        raise RuntimeError("Technical-evidence navigator was not readable at mobile width.")
    print(json.dumps({"technical_evidence_navigator_mobile": "complete", "responsive": responsive}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Mobile technical-evidence navigator validation failed: {error}", file=sys.stderr)
        sys.exit(1)
