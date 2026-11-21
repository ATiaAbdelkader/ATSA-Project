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
    for message_id in range(33, 290):
        time.sleep(0.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        if "Analysis complete — review required" in text:
            break
        if "Analysis could not complete" in text:
            raise RuntimeError("Mobile analysis failed before landscape validation.")
    else:
        raise RuntimeError("Mobile analysis did not complete within the timeout.")
    rendered = evaluate(socket, "(() => { const panel = document.querySelector('.landscape-panel'); const svg = document.querySelector('.kinematic-landscape svg'); return Boolean(panel && svg && document.querySelectorAll('.landscape-point').length) && panel.getBoundingClientRect().width <= 375 && svg.getBoundingClientRect().width <= panel.getBoundingClientRect().width; })()", 291)
    selected = evaluate(socket, "(() => { const point = document.querySelector('.landscape-point'); point?.dispatchEvent(new MouseEvent('click', { bubbles: true })); return Boolean(point); })()", 292)
    time.sleep(0.2)
    inspector = evaluate(socket, "document.body.innerText.includes('SELECTED TRAJECTORY')", 293)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, 294)
    if not rendered or not selected or not inspector:
        raise RuntimeError(f"Mobile landscape validation failed: rendered={rendered}, selected={selected}, inspector={inspector}")
    print(json.dumps({"kinematic_landscape_mobile": "complete", "responsive_render": rendered, "selection": selected, "trajectory_inspector": inspector}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Mobile kinematic landscape validation failed: {error}", file=sys.stderr)
        sys.exit(1)
