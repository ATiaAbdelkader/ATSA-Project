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
    for message_id in range(start_message_id, start_message_id + 100):
        time.sleep(0.12)
        if evaluate(socket, expression, message_id):
            return message_id + 1
    raise RuntimeError(f"Timed out waiting for {description}.")


def validate_viewport(socket, message_id):
    message_id = wait_for(socket, "Boolean(document.querySelector('[aria-label=\"Select browser-local camera preview resolution\"]'))", message_id, "camera profile control")
    evaluate(socket, "(() => { const select = document.querySelector('[aria-label=\"Select browser-local camera preview resolution\"]'); select.value = 'detail'; select.dispatchEvent(new Event('change', { bubbles: true })); Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => { const stream = new MediaStream(); const track = { label: 'Mock microscope camera', getSettings: () => ({ width: 1024, height: 768, frameRate: 59.94, resizeMode: 'crop-and-scale' }), addEventListener: () => {}, removeEventListener: () => {}, stop: () => {} }; Object.defineProperty(stream, 'getVideoTracks', { configurable: true, value: () => [track] }); Object.defineProperty(stream, 'getTracks', { configurable: true, value: () => [track] }); return stream; } }); Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', { configurable: true, value: async () => [] }); class MockRecorder { static isTypeSupported() { return true; } constructor(stream, options) { this.mimeType = options?.mimeType || 'video/webm'; this.state = 'inactive'; } start() { this.state = 'recording'; } stop() { if (this.state !== 'recording') return; this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['local'], { type: 'video/webm' }) }); this.onstop?.(); } } Object.defineProperty(window, 'MediaRecorder', { configurable: true, value: MockRecorder }); HTMLMediaElement.prototype.play = async function() {}; })()", message_id + 1)
    evaluate(socket, "[...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Start preview')?.click()", message_id + 2)
    message_id = wait_for(socket, "[...document.querySelectorAll('.camera-controls button')].some(button => button.innerText.trim() === '2 s clip')", message_id + 3, "active local preview")
    evaluate(socket, "(() => { const select = document.querySelector('[aria-label=\"Select microscope pre-capture stabilization delay\"]'); select.value = '3'; select.dispatchEvent(new Event('change', { bubbles: true })); })()", message_id)
    evaluate(socket, "[...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === '2 s clip')?.click()", message_id + 1)
    message_id = wait_for(socket, "[...document.querySelectorAll('.camera-controls button')].some(button => button.innerText.trim() === 'Cancel delay')", message_id + 2, "local pre-capture stabilization")
    message_id = wait_for(socket, "[...document.querySelectorAll('.camera-controls button')].some(button => button.innerText.trim() === 'Stop' && button.classList.contains('recording'))", message_id, "local camera recording")
    evaluate(socket, "[...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Stop' && button.classList.contains('recording'))?.click()", message_id)
    message_id = wait_for(socket, "document.querySelector('[aria-label=\"Active footage provenance\"]')?.innerText.includes('Pre-capture delay')", message_id + 1, "staged camera stabilization provenance")
    evidence = evaluate(socket, "document.querySelector('[aria-label=\"Active footage provenance\"]')?.innerText || ''", message_id)
    normalized = " ".join(evidence.split())
    valid = "Preview profile Detail 1280 × 720" in normalized and "Preview frame rate 59.9 fps" in normalized and "Preview resize mode crop and scale" in normalized and "Pre-capture delay 3 s" in normalized and "Local intake context only. It does not measure specimen properties or alter analysis." in normalized
    if not valid:
        raise RuntimeError(f"Staged clip preview provenance was incomplete: {evidence!r}")
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
    print(json.dumps({"camera_preview_provenance": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Camera preview provenance validation failed: {error}", file=sys.stderr)
        sys.exit(1)
