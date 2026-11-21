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
    message_id = wait_for(socket, "Boolean(document.querySelector('[aria-label=\"Refresh local camera device list\"]'))", message_id, "camera refresh control")
    evaluate(socket, """(() => {
      Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', {
        configurable: true,
        value: async () => [
          { deviceId: 'audio-1', kind: 'audioinput', label: 'Microphone' },
          { deviceId: 'camera-1', kind: 'videoinput', label: 'Microscope camera' },
          { deviceId: 'camera-2', kind: 'videoinput', label: '' }
        ]
      });
    })()""", message_id)
    evaluate(socket, "document.querySelector('[aria-label=\"Refresh local camera device list\"]')?.click()", message_id + 1)
    message_id = wait_for(socket, "(() => { const options = [...document.querySelector('[aria-label=\"Select microscope camera\"]')?.options || []].map(option => option.textContent?.trim()); return options.includes('Microscope camera') && options.includes('Camera 2') && !options.includes('Microphone'); })()", message_id + 2, "refreshed local video-input list")
    permission_free = evaluate(socket, "!document.body.innerText.includes('Camera preview is active') && document.body.innerText.includes('does not start a preview or request camera permission')", message_id)
    if not permission_free:
        raise RuntimeError("Device refresh did not remain permission-free and pre-preview.")
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
    print(json.dumps({"camera_device_refresh": "complete", "desktop": True, "mobile": True, "permission_free": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Camera device refresh validation failed: {error}", file=sys.stderr)
        sys.exit(1)
