import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer/?view=method"


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
    for message_id in range(3, 35):
        time.sleep(0.2)
        valid = evaluate(socket, "(() => { const item = document.querySelector('.method-fingerprint'); return Boolean(item && /^SS-BOV-[A-F0-9]{8}$/.test(item.innerText.trim()) && item.getBoundingClientRect().width <= 375); })()", message_id)
        if valid:
            break
    else:
        raise RuntimeError("Method fingerprint was not readable at mobile width.")
    fingerprint = evaluate(socket, "document.querySelector('.method-fingerprint')?.innerText.trim()", 36)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, 37)
    print(json.dumps({"method_fingerprint_mobile": "complete", "fingerprint": fingerprint, "responsive": valid}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Mobile method fingerprint validation failed: {error}", file=sys.stderr)
        sys.exit(1)
