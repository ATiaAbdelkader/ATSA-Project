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


def command(socket, method, params, message_id):
    socket.send(json.dumps({"id": message_id, "method": method, "params": params}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            return response.get("result", {})


def verify(socket, start_id):
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", start_id)
    for message_id in range(start_id + 1, start_id + 40):
        time.sleep(0.2)
        if evaluate(socket, "(() => { const video = document.querySelector('video.analysis-video'); const button = [...document.querySelectorAll('.review-playback-controls button')].find(item => item.innerText.trim() === '0.5×'); return Boolean(video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && button && !button.disabled); })()", message_id):
            break
    else:
        raise RuntimeError("Enabled local playback-speed controls did not render after video decoding.")
    evaluate(socket, "[...document.querySelectorAll('.review-playback-controls button')].find(item => item.innerText.trim() === '0.5×')?.click()", start_id + 41)
    slow = evaluate(socket, "document.querySelector('video.analysis-video')?.playbackRate === 0.5 && [...document.querySelectorAll('.review-playback-controls button')].find(item => item.innerText.trim() === '0.5×')?.getAttribute('aria-pressed') === 'true'", start_id + 42)
    evaluate(socket, "[...document.querySelectorAll('.review-playback-controls button')].find(item => item.innerText.trim() === '2×')?.click()", start_id + 43)
    fast = evaluate(socket, "document.querySelector('video.analysis-video')?.playbackRate === 2 && [...document.querySelectorAll('.review-playback-controls button')].find(item => item.innerText.trim() === '2×')?.getAttribute('aria-pressed') === 'true'", start_id + 44)
    evaluate(socket, "[...document.querySelectorAll('.sample-row')].find(item => item.innerText.includes('Reference field 02'))?.click()", start_id + 45)
    for message_id in range(start_id + 46, start_id + 76):
        time.sleep(0.15)
        reset = evaluate(socket, "document.querySelector('video.analysis-video')?.playbackRate === 1 && [...document.querySelectorAll('.review-playback-controls button')].find(item => item.innerText.trim() === '1×')?.getAttribute('aria-pressed') === 'true'", message_id)
        if reset:
            break
    else:
        raise RuntimeError("Replacement local footage did not reset technical review playback speed to normal.")
    if not slow or not fast:
        raise RuntimeError(f"Browser-local playback speed controls did not update correctly: slow={slow}, fast={fast}")
    return {"slow_review": slow, "fast_review": fast, "replacement_reset": reset}


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    desktop = verify(socket, 1)
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, 200)
    mobile = verify(socket, 300)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, 500)
    print(json.dumps({"review_playback": "complete", "desktop": desktop, "mobile_375x812": mobile}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Review playback validation failed: {error}", file=sys.stderr)
        sys.exit(1)
