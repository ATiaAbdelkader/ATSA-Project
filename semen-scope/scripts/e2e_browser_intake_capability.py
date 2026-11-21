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


def check_capability_card(socket, message_id):
    return evaluate(socket, """(() => {
      const card = document.querySelector('.browser-intake-capability');
      const items = [...document.querySelectorAll('.intake-capability-list > div')];
      const body = document.body.innerText;
      return Boolean(card) && items.length === 6 &&
        ['Secure browser context', 'Camera preview API', 'Short clip recording', 'Local frame canvas', 'H.264 MP4 playback', 'WebM playback'].every(label => body.includes(label)) &&
        body.includes('does not request camera access') &&
        card.getBoundingClientRect().width > 0;
    })()""", message_id)


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    for message_id in range(2, 32):
        time.sleep(0.2)
        if check_capability_card(socket, message_id):
            break
    else:
        raise RuntimeError("Desktop browser intake capability card did not render with all expected evidence.")
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, 32)
    mobile_ready = check_capability_card(socket, 33)
    card_width = evaluate(socket, "document.querySelector('.browser-intake-capability')?.getBoundingClientRect().width || 0", 34)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, 35)
    socket.close()
    if not mobile_ready or card_width > 375:
        raise RuntimeError("Browser intake capability card was not readable at mobile width.")
    print(json.dumps({"browser_intake_capability": "complete", "desktop": True, "mobile": True, "permission_free": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Browser intake capability validation failed: {error}", file=sys.stderr)
        sys.exit(1)
