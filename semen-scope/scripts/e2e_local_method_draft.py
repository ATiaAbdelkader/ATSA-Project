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


def set_value(socket, expression, value, message_id):
    return evaluate(socket, f"""(() => {{ const input = {expression}; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, {json.dumps(value)}); input.dispatchEvent(new Event('input', {{ bubbles: true }})); input.dispatchEvent(new Event('change', {{ bubbles: true }})); return input.value; }})()""", message_id)


def validate_viewport(socket, message_id):
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Save local draft'))", message_id, "local method-draft controls")
    input_expression = "[...document.querySelectorAll('.metadata-panel input[type=number]')][0]"
    original = set_value(socket, input_expression, "0.42", message_id)
    if original != "0.42":
        raise RuntimeError("Could not set the active browser-local calibration draft.")
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Save local draft')?.click()", message_id + 1)
    stored = evaluate(socket, f"JSON.parse(localStorage.getItem({json.dumps(LOCAL_DRAFT_KEY)}))", message_id + 2)
    if not isinstance(stored, dict) or stored.get("calibration", {}).get("micronsPerPixel") != 0.42 or "calibrationEvidence" in stored:
        raise RuntimeError("Local method draft did not save the expected standalone method values.")
    set_value(socket, input_expression, "0.77", message_id + 3)
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Restore local draft')?.click()", message_id + 4)
    restored = evaluate(socket, f"{input_expression}.value", message_id + 5)
    if restored != "0.42":
        raise RuntimeError("Restoring the browser-local method draft did not reset the active method calibration.")
    safeguard = evaluate(socket, "document.body.innerText.includes('Restoring clears board evidence and never changes an immutable analysis record.')", message_id + 6)
    if not safeguard:
        raise RuntimeError("Local method-draft safeguard text was not visible.")
    status_visible = evaluate(socket, "document.querySelector('.local-method-draft-status')?.innerText.includes('Local draft available')", message_id + 7)
    if not status_visible:
        raise RuntimeError("Saved browser-local draft status was not visible.")
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Clear local draft')?.click()", message_id + 8)
    cleared = evaluate(socket, f"localStorage.getItem({json.dumps(LOCAL_DRAFT_KEY)}) === null && document.querySelector('.local-method-draft-status')?.innerText === 'No browser-local method draft saved' && {input_expression}.value === '0.42'", message_id + 9)
    if not cleared:
        raise RuntimeError("Clearing local draft did not remove only browser-local storage while retaining the active method.")
    invalid_draft = {"schema": "semenscope.browser-local-method-draft.v1", "savedAt": "2026-08-23T10:00:00.000Z", "species": "Bovine", "calibration": {"micronsPerPixel": 0.11, "frameRate": 25}, "thresholds": {}}
    evaluate(socket, f"localStorage.setItem({json.dumps(LOCAL_DRAFT_KEY)}, {json.dumps(json.dumps(invalid_draft))})", message_id + 10)
    set_value(socket, input_expression, "0.63", message_id + 11)
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Restore local draft')?.click()", message_id + 12)
    rejected = evaluate(socket, f"{input_expression}.value === '0.63'", message_id + 13)
    if not rejected:
        raise RuntimeError("Malformed local-draft thresholds changed the active method instead of being rejected.")
    return message_id + 14


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
    print(json.dumps({"local_method_draft": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Local method draft validation failed: {error}", file=sys.stderr)
        sys.exit(1)
