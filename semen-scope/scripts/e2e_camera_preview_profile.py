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
    message_id = wait_for(socket, "Boolean(document.querySelector('[aria-label=\"Select browser-local camera preview resolution\"]'))", message_id, "camera preview profile control")
    ready = evaluate(socket, "(() => { const select = document.querySelector('[aria-label=\"Select browser-local camera preview resolution\"]'); return select && [...select.options].map(option => option.value).join(',') === 'native,detail,compat' && select.value === 'native' && document.body.innerText.includes('confirm calibration after a camera or resolution change'); })()", message_id)
    if not ready:
        raise RuntimeError("The camera native, detail, and compatibility preview profiles did not render with their calibration note.")
    orientation_ready = evaluate(socket, "(() => { const select = document.querySelector('[aria-label=\"Select browser-local camera preview orientation\"]'); return select && [...select.options].map(option => option.value).join(',') === 'normal,mirrored' && select.value === 'normal' && document.body.innerText.includes('Display only: captured frames, board calibration, and analysis pixels are unchanged.'); })()", message_id + 1)
    if not orientation_ready:
        raise RuntimeError("The display-only normal and mirrored camera preview orientation controls did not render.")
    evaluate(socket, "(() => { const select = document.querySelector('[aria-label=\"Select browser-local camera preview resolution\"]'); select.value = 'detail'; select.dispatchEvent(new Event('change', { bubbles: true })); const orientation = document.querySelector('[aria-label=\"Select browser-local camera preview orientation\"]'); orientation.value = 'mirrored'; orientation.dispatchEvent(new Event('change', { bubbles: true })); window.__cameraConstraints = null; Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async constraints => { window.__cameraConstraints = constraints; const stream = new MediaStream(); const track = { label: 'Mock microscope camera', getSettings: () => ({ width: 1024, height: 768, frameRate: 59.94, resizeMode: 'crop-and-scale' }), addEventListener: () => {}, removeEventListener: () => {}, stop: () => {} }; Object.defineProperty(stream, 'getVideoTracks', { configurable: true, value: () => [track] }); Object.defineProperty(stream, 'getTracks', { configurable: true, value: () => [track] }); return stream; } }); Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', { configurable: true, value: async () => [] }); HTMLMediaElement.prototype.play = async function() {}; })()", message_id + 2)
    evaluate(socket, "[...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Start preview')?.click()", message_id + 2)
    requested = evaluate(socket, "window.__cameraConstraints?.video?.width?.ideal === 1280 && window.__cameraConstraints?.video?.height?.ideal === 720", message_id + 4)
    locked = evaluate(socket, "document.querySelector('[aria-label=\"Select browser-local camera preview resolution\"]')?.disabled === true && document.querySelector('[aria-label=\"Select browser-local camera preview orientation\"]')?.disabled === true", message_id + 5)
    mirrored = evaluate(socket, "document.querySelector('.camera-preview video')?.classList.contains('camera-preview-mirrored') === true", message_id + 6)
    message_id = wait_for(socket, "Boolean(document.querySelector('.camera-preview-resolution-evidence'))", message_id + 7, "browser-reported camera resolution evidence")
    evidence_text = evaluate(socket, "document.querySelector('.camera-preview-resolution-evidence')?.innerText || ''", message_id)
    normalized_evidence = " ".join(evidence_text.split())
    mismatch_review = evaluate(socket, "document.body.innerText.includes('Browser camera reports 59.9 fps while the configured analysis rate is 25 fps')", message_id + 1)
    readiness = evaluate(socket, "document.body.innerText.includes('CAMERA ACQUISITION READINESS') && document.body.innerText.includes('2 setup items need technical review') && document.body.innerText.includes('Technical setup guidance only. It does not block capture')", message_id + 2)
    expected_evidence = "Requested: Detail 1280 × 720" in normalized_evidence and "Actual stream: 1024 × 768" in normalized_evidence and "Actual rate: 59.9 fps" in normalized_evidence and "Resize mode: Crop and scale" in normalized_evidence and "Analysis rate: 25 fps" in normalized_evidence and "Requested resolution is advisory" in normalized_evidence
    if not requested or not locked or not mirrored or not expected_evidence or not mismatch_review or not readiness:
        raise RuntimeError(f"Detail profile constraints, display-only mirror orientation, actual stream evidence, frame-rate review, readiness card, or active-preview lock did not apply: requested={requested}, locked={locked}, mirrored={mirrored}, evidence={evidence_text!r}, mismatch_review={mismatch_review}, readiness={readiness}")
    evaluate(socket, "(() => { const video = document.querySelector('.camera-preview video'); Object.defineProperty(video, 'videoWidth', { configurable: true, value: 1024 }); Object.defineProperty(video, 'videoHeight', { configurable: true, value: 768 }); HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,bG9jYWw='; })()", message_id + 1)
    evaluate(socket, "[...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Still')?.click()", message_id + 2)
    message_id = wait_for(socket, "[...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Download still')?.disabled === false", message_id + 3, "captured local microscope still")
    evaluate(socket, "(() => { window.__cameraStillDownload = ''; HTMLAnchorElement.prototype.click = function() { window.__cameraStillDownload = this.download; }; })()", message_id)
    evaluate(socket, "[...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Download still')?.click()", message_id + 1)
    still_downloaded = evaluate(socket, "window.__cameraStillDownload.startsWith('reference-field-03-microscope-still-') && window.__cameraStillDownload.endsWith('.png')", message_id + 2)
    if not still_downloaded:
        raise RuntimeError("The captured local microscope still did not use the expected browser-local PNG download filename.")
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
    print(json.dumps({"camera_preview_profile": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Camera preview profile validation failed: {error}", file=sys.stderr)
        sys.exit(1)
