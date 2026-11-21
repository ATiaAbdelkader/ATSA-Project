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


def set_input(socket, selector, value, message_id):
    return evaluate(socket, f"""(() => {{
      const input = document.querySelector({json.dumps(selector)});
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, {json.dumps(value)});
      input.dispatchEvent(new Event('input', {{ bubbles: true }}));
      input.dispatchEvent(new Event('change', {{ bubbles: true }}));
      return input.value;
    }})()""", message_id)


def validate_viewport(socket, message_id):
    message_id = wait_for(socket, "Boolean(document.querySelector('input[placeholder=\"e.g., 20×\"]')) && Boolean(document.querySelector('input[placeholder=\"e.g., 20\"]'))", message_id, "optics traceability controls")
    if set_input(socket, "input[placeholder='e.g., 20×']", "20×", message_id) != "20×":
        raise RuntimeError("Objective magnification did not retain the operator-entered value.")
    if set_input(socket, "input[placeholder='e.g., 20']", "20", message_id + 1) != "20":
        raise RuntimeError("Chamber depth did not retain the operator-entered value.")
    retained = evaluate(socket, "document.querySelector('input[placeholder=\"e.g., 20×\"]')?.value === '20×' && document.querySelector('input[placeholder=\"e.g., 20\"]')?.value === '20' && document.body.innerText.includes('Recorded method context only. These entries do not recalibrate footage or change any metric.')", message_id + 2)
    if not retained:
        raise RuntimeError("The optics traceability controls were not retained with their safeguard text.")
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
    print(json.dumps({"optics_traceability": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Optics traceability validation failed: {error}", file=sys.stderr)
        sys.exit(1)
