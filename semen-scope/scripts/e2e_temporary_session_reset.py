import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer"
LOCAL_DRAFT_KEY = "semenscope.browser-local-method-draft.v1"


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


def set_input(socket, selector, value, message_id):
    return evaluate(socket, f"""(() => {{ const input = document.querySelector({json.dumps(selector)}); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, {json.dumps(value)}); input.dispatchEvent(new Event('input', {{ bubbles: true }})); input.dispatchEvent(new Event('change', {{ bubbles: true }})); return input.value; }})()""", message_id)


def validate_viewport(socket, message_id):
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Clear temporary local session'))", message_id, "temporary session reset control")
    if set_input(socket, "input[placeholder='e.g., EJ-024']", "EJ-42", message_id) != "EJ-42":
        raise RuntimeError("Could not set specimen context before reset.")
    if set_input(socket, "input[placeholder='e.g., 20×']", "20×", message_id + 1) != "20×":
        raise RuntimeError("Could not set optics context before reset.")
    draft = {"schema": "semenscope.browser-local-method-draft.v1", "savedAt": "2026-08-23T10:00:00.000Z", "species": "Bovine", "calibration": {"micronsPerPixel": 0.5, "frameRate": 25}, "thresholds": {}}
    evaluate(socket, f"localStorage.setItem({json.dumps(LOCAL_DRAFT_KEY)}, {json.dumps(json.dumps(draft))})", message_id + 2)
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Clear temporary local session')?.click()", message_id + 3)
    message_id = wait_for(socket, "document.querySelector('input[placeholder=\"e.g., EJ-024\"]')?.value === '' && document.querySelector('input[placeholder=\"e.g., 20×\"]')?.value === '' && document.body.innerText.includes('Reference field 03')", message_id + 4, "cleared temporary session")
    preserved = evaluate(socket, f"localStorage.getItem({json.dumps(LOCAL_DRAFT_KEY)}) === {json.dumps(json.dumps(draft))}", message_id)
    if not preserved:
        raise RuntimeError("Temporary session reset unexpectedly changed browser-local method draft storage.")
    return message_id + 1


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
    print(json.dumps({"temporary_session_reset": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Temporary session reset validation failed: {error}", file=sys.stderr)
        sys.exit(1)
