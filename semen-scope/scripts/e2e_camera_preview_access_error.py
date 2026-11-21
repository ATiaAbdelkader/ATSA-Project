import json
import sys
from urllib.request import urlopen

import websocket

from e2e_recording_countdown import APP_URL, DEVTOOLS_URL, command, evaluate, install_recording_mocks, wait_for


def validate_viewport(socket, message_id):
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Start preview'))", message_id, "camera preview control")
    install_recording_mocks(socket, message_id)
    evaluate(socket, "window.__semenScopeThrowOnGetUserMedia = true; [...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Start preview')?.click()", message_id + 1)
    message_id = wait_for(socket, "!document.querySelector('.active-camera-preview-label') && document.querySelector('.camera-preview-access-error-note')?.innerText.includes('Camera preview could not start') && document.querySelector('.camera-preview-access-error-note')?.getAttribute('role') === 'status' && document.querySelector('.footage-provenance')?.innerText.includes('Bundled reference') && !document.querySelector('.footage-provenance')?.innerText.includes('Local camera capture')", message_id + 2, "camera preview-access failure recovery")
    evaluate(socket, "window.__semenScopeThrowOnGetUserMedia = false; [...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Start preview')?.click()", message_id)
    message_id = wait_for(socket, "document.querySelector('.active-camera-preview-label')?.innerText.includes('Active microscope stream') && !document.querySelector('.camera-preview-access-error-note') && document.querySelector('.footage-provenance')?.innerText.includes('Bundled reference')", message_id + 1, "successful preview retry after access failure")
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
    print(json.dumps({"camera_preview_access_error": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Camera preview access error validation failed: {error}", file=sys.stderr)
        sys.exit(1)
