import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iwvd519yvkeifos54o1zl-ceb6452e.us2.manus.computer"


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
    message_id = wait_for(socket, "Boolean(document.querySelector('[aria-label=\"Select microscope pre-capture stabilization delay\"]'))", message_id, "pre-capture delay control")
    ready = evaluate(socket, "(() => { const select = document.querySelector('[aria-label=\"Select microscope pre-capture stabilization delay\"]'); return select && [...select.options].map(option => option.value).join(',') === '0,3,5' && select.value === '0'; })()", message_id)
    if not ready:
        raise RuntimeError("The bounded 0, 3, and 5 second pre-capture delay options did not render.")
    evaluate(socket, "(() => { const select = document.querySelector('[aria-label=\"Select microscope pre-capture stabilization delay\"]'); select.value = '3'; select.dispatchEvent(new Event('change', { bubbles: true })); Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => { const stream = new MediaStream(); const track = { label: 'Mock microscope camera', getSettings: () => ({ width: 1024, height: 768, frameRate: 25 }), stop: () => {} }; track.addEventListener = (event, callback) => { if (event === 'ended') window.__triggerCameraStreamEnded = callback; }; track.removeEventListener = () => {}; Object.defineProperty(stream, 'getVideoTracks', { configurable: true, value: () => [track] }); Object.defineProperty(stream, 'getTracks', { configurable: true, value: () => [track] }); return stream; } }); Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', { configurable: true, value: async () => [] }); HTMLMediaElement.prototype.play = async function() {}; })()", message_id + 1)
    evaluate(socket, "[...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Start preview')?.click()", message_id + 2)
    message_id = wait_for(socket, "[...document.querySelectorAll('.camera-controls button')].some(button => button.innerText.trim() === '2 s clip')", message_id + 3, "active preview")
    evaluate(socket, "[...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === '2 s clip')?.click()", message_id)
    message_id = wait_for(socket, "document.body.innerText.includes('Stabilizing local preview') && [...document.querySelectorAll('.camera-controls button')].some(button => button.innerText.trim() === 'Cancel delay')", message_id + 1, "active local stabilization delay")
    locked = evaluate(socket, "document.querySelector('[aria-label=\"Select microscope pre-capture stabilization delay\"]')?.disabled === true && document.querySelector('[aria-label=\"Select microscope clip duration\"]')?.disabled === true", message_id)
    exit_guarded = evaluate(socket, "(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })()", message_id + 1)
    evaluate(socket, "[...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Cancel delay')?.click()", message_id + 2)
    restored = evaluate(socket, "[...document.querySelectorAll('.camera-controls button')].some(button => button.innerText.trim() === '2 s clip') && !document.body.innerText.includes('Stabilizing local preview') && document.querySelector('[aria-label=\"Select microscope pre-capture stabilization delay\"]')?.disabled === false", message_id + 2)
    evaluate(socket, "[...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === '2 s clip')?.click()", message_id + 3)
    message_id = wait_for(socket, "document.body.innerText.includes('Stabilizing local preview')", message_id + 4, "second local stabilization delay")
    evaluate(socket, "window.__triggerCameraStreamEnded?.()", message_id)
    message_id = wait_for(socket, "[...document.querySelectorAll('.camera-controls button')].some(button => button.innerText.trim() === 'Start preview') && !document.body.innerText.includes('Stabilizing local preview')", message_id + 1, "stream-end stabilization recovery")
    stream_end_recovered = evaluate(socket, "document.querySelector('[aria-label=\"Select microscope pre-capture stabilization delay\"]')?.disabled === false", message_id)
    if not locked or not exit_guarded or not restored or not stream_end_recovered:
        raise RuntimeError(f"The local pre-capture stabilization locks, exit safeguard, cancellation, or stream-end recovery did not apply: locked={locked}, exit_guarded={exit_guarded}, restored={restored}, stream_end_recovered={stream_end_recovered}")
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
    print(json.dumps({"camera_pre_capture_delay": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Camera pre-capture delay validation failed: {error}", file=sys.stderr)
        sys.exit(1)
