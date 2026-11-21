import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iwvd519yvkeifos54o1zl-ceb6452e.us2.manus.computer"


def evaluate(socket, expression, message_id):
    socket.send(json.dumps({"id": message_id, "method": "Runtime.evaluate", "params": {"expression": expression, "returnByValue": True, "awaitPromise": True}}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            if "exceptionDetails" in response.get("result", {}):
                raise RuntimeError(response["result"]["exceptionDetails"].get("text", "Browser evaluation failed"))
            return response.get("result", {}).get("result", {}).get("value")


def verify(socket, start_id):
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", start_id)
    for message_id in range(start_id + 1, start_id + 40):
        time.sleep(0.2)
        if evaluate(socket, "(() => { const video = document.querySelector('video.analysis-video'); const next = [...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Next frame'); return Boolean(video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && next && !next.disabled); })()", message_id):
            break
    else:
        raise RuntimeError("Enabled local frame-review controls did not render after video decoding.")
    initial = evaluate(socket, "(() => { const video = document.querySelector('video.analysis-video'); video.currentTime = 0.2; return video.currentTime; })()", start_id + 41)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Next frame')?.click()", start_id + 42)
    for message_id in range(start_id + 43, start_id + 63):
        time.sleep(0.1)
        advanced = evaluate(socket, "document.querySelector('video.analysis-video')?.currentTime > 0.2", message_id)
        if advanced:
            break
    else:
        raise RuntimeError("Next frame did not advance the local preview.")
    after_next = evaluate(socket, "document.querySelector('video.analysis-video')?.currentTime", start_id + 64)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Previous frame')?.click()", start_id + 65)
    for message_id in range(start_id + 66, start_id + 86):
        time.sleep(0.1)
        after_previous = evaluate(socket, "document.querySelector('video.analysis-video')?.currentTime", message_id)
        if after_previous < after_next:
            return {"initial_seconds": initial, "after_next_seconds": after_next, "after_previous_seconds": after_previous}
    raise RuntimeError("Previous frame did not move the local preview backward.")


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    desktop = verify(socket, 1)
    evaluate(socket, "window.innerWidth", 200)
    evaluate(socket, "null", 201)
    socket.send(json.dumps({"id": 202, "method": "Emulation.setDeviceMetricsOverride", "params": {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}}))
    socket.recv()
    mobile = verify(socket, 300)
    socket.send(json.dumps({"id": 500, "method": "Emulation.clearDeviceMetricsOverride", "params": {}}))
    socket.recv()
    print(json.dumps({"frame_review": "complete", "desktop": desktop, "mobile_375x812": mobile}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Frame review validation failed: {error}", file=sys.stderr)
        sys.exit(1)
