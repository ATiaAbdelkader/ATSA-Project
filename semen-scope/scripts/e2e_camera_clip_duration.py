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


def wait_for(socket, expression, start_message_id, description):
    for message_id in range(start_message_id, start_message_id + 80):
        time.sleep(0.12)
        if evaluate(socket, expression, message_id):
            return message_id + 1
    raise RuntimeError(f"Timed out waiting for {description}.")


def validate_viewport(socket, message_id):
    message_id = wait_for(socket, "Boolean(document.querySelector('[aria-label=\"Select microscope clip duration\"]'))", message_id, "clip-duration control")
    ready = evaluate(socket, "(() => { const select = document.querySelector('[aria-label=\"Select microscope clip duration\"]'); return select && [...select.options].map(option => option.value).join(',') === '2,5,10' && select.value === '2'; })()", message_id)
    if not ready:
        raise RuntimeError("The bounded 2, 5, and 10 second duration options did not render.")
    evaluate(socket, "(() => { const select = document.querySelector('[aria-label=\"Select microscope clip duration\"]'); select.value = '5'; select.dispatchEvent(new Event('change', { bubbles: true })); })()", message_id + 1)
    changed = evaluate(socket, "[...document.querySelectorAll('.camera-controls button')].some(button => button.innerText.trim() === '5 s clip')", message_id + 2)
    if not changed:
        raise RuntimeError("Selecting a five-second capture duration did not update the capture control.")
    return message_id + 3


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    message_id = validate_viewport(socket, 2)
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, message_id)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", message_id + 1)
    message_id = validate_viewport(socket, message_id + 2)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, message_id)
    socket.close()
    print(json.dumps({"camera_clip_duration": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Camera clip duration validation failed: {error}", file=sys.stderr)
        sys.exit(1)
