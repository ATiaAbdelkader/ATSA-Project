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
    for message_id in range(start_message_id, start_message_id + 100):
        time.sleep(0.12)
        if evaluate(socket, expression, message_id):
            return message_id + 1
    raise RuntimeError(f"Timed out waiting for {description}.")


def escape_cancel(socket, message_id):
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis')?.click()", message_id)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.includes('Cancel run'))) && document.querySelector('[aria-keyshortcuts=\"Escape\"]')?.getAttribute('title') === 'Cancel this local analysis (Escape)'", message_id + 1, "visible Escape cancellation control")
    command(socket, "Input.dispatchKeyEvent", {"type": "keyDown", "key": "Escape", "code": "Escape", "windowsVirtualKeyCode": 27, "nativeVirtualKeyCode": 27}, message_id)
    message_id = wait_for(socket, "document.body.innerText.includes('Analysis cancelled — no new result was created.') && Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'))", message_id + 1, "Escape cancellation state")
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis')?.click()", message_id)
    return wait_for(socket, "document.body.innerText.includes('Analysis complete — review required')", message_id + 1, "rerun after Escape cancellation")


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'))", 2, "desktop run control")
    message_id = escape_cancel(socket, message_id)
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, message_id)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", message_id + 1)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'))", message_id + 2, "mobile run control")
    message_id = escape_cancel(socket, message_id)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, message_id)
    socket.close()
    print(json.dumps({"escape_cancellation": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Escape cancellation validation failed: {error}", file=sys.stderr)
        sys.exit(1)
