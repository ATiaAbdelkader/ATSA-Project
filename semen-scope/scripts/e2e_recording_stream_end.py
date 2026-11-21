import json
import sys
from urllib.request import urlopen

import websocket

from e2e_recording_countdown import APP_URL, DEVTOOLS_URL, command, evaluate, install_recording_mocks, wait_for


def validate_viewport(socket, message_id):
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Start preview'))", message_id, "camera preview control")
    install_recording_mocks(socket, message_id)
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Start preview')?.click()", message_id + 1)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === '2 s clip'))", message_id + 2, "two-second camera capture control")
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === '2 s clip')?.click()", message_id)
    message_id = wait_for(socket, "document.querySelector('.recording-countdown')?.innerText.includes('Recording locally') && document.querySelector('[aria-label=\"Select microscope camera\"]')?.disabled === true", message_id + 1, "active recording before stream termination")
    evaluate(socket, "window.__semenScopeMockCameraTrack?.endForTest()", message_id)
    message_id = wait_for(socket, "!document.querySelector('.recording-countdown') && document.querySelector('[aria-label=\"Select microscope camera\"]')?.disabled === false && !document.querySelector('.active-camera-preview-label') && document.querySelector('.footage-provenance')?.innerText.includes('Local camera capture') && document.querySelector('.footage-provenance')?.innerText.includes('Actual local recording') && document.querySelector('.footage-provenance')?.innerText.includes('Recording stopped') && document.querySelector('.footage-provenance')?.innerText.includes('active camera stream ended') && document.querySelector('.camera-stream-interruption-note')?.innerText.includes('Camera stream ended during local recording') && document.querySelector('.camera-stream-interruption-note')?.getAttribute('role') === 'status' && !document.querySelector('.footage-provenance')?.innerText.includes('operator stopped') && !document.querySelector('.footage-provenance')?.innerText.includes('requested duration reached')", message_id + 1, "stream-ended recording provenance and persistent operator guidance")
    return message_id


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
    print(json.dumps({"recording_stream_end": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Stream-end recording validation failed: {error}", file=sys.stderr)
        sys.exit(1)
