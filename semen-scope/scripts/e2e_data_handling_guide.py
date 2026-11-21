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


def validate(socket, message_id):
    for candidate in range(message_id, message_id + 100):
        time.sleep(0.12)
        if evaluate(socket, "Boolean(document.querySelector('.data-handling-guide'))", candidate):
            message_id = candidate + 1
            break
    else:
        raise RuntimeError("Browser-local data-handling guide did not render.")
    visible = evaluate(socket, "(() => { const guide = document.querySelector('.data-handling-guide'); guide.open = true; return guide.innerText.includes('Temporary workspace context') && guide.innerText.includes('Browser-local method draft') && guide.innerText.includes('Authenticated immutable record') && guide.innerText.includes('Video bytes are not stored in the database'); })()", message_id)
    if not visible:
        raise RuntimeError("Browser-local data-handling guide did not expose all required storage-context explanations.")
    return message_id + 1


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    message_id = validate(socket, 2)
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, message_id)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", message_id + 1)
    message_id = validate(socket, message_id + 2)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, message_id)
    socket.close()
    print(json.dumps({"data_handling_guide": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Data-handling guide validation failed: {error}", file=sys.stderr)
        sys.exit(1)
