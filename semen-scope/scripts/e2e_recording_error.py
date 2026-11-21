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
    message_id = wait_for(socket, "document.querySelector('.recording-countdown')?.innerText.includes('Recording locally') && document.querySelector('[aria-label=\"Select microscope camera\"]')?.disabled === true && [...document.querySelectorAll('.sample-row')].every(button => button.disabled) && document.querySelector('.upload-action')?.disabled === true && document.querySelector('.metadata-panel')?.disabled === true && document.querySelector('.specimen-workflow-panel')?.disabled === true && document.querySelector('.calibration-wizard-panel')?.disabled === true && document.querySelector('.thresholds-panel')?.disabled === true", message_id + 1, "active recording source and method locks before simulated recorder error")
    evaluate(socket, "window.__semenScopeMockRecorder?.failForTest()", message_id)
    message_id = wait_for(socket, "!document.querySelector('.recording-countdown') && !document.querySelector('.camera-selection-lock-note') && document.querySelector('[aria-label=\"Select microscope camera\"]')?.disabled === false && [...document.querySelectorAll('.sample-row')].every(button => !button.disabled) && document.querySelector('.upload-action')?.disabled === false && document.querySelector('.metadata-panel')?.disabled === false && document.querySelector('.specimen-workflow-panel')?.disabled === false && document.querySelector('.calibration-wizard-panel')?.disabled === false && document.querySelector('.thresholds-panel')?.disabled === false && !document.querySelector('.analysis-input-lock-note') && !document.querySelector('.privacy-note[role=\"status\"]') && document.querySelector('.active-camera-preview-label')?.innerText.includes('Active microscope stream') && document.querySelector('.camera-recording-error-note')?.innerText.includes('Camera recording encountered a browser error') && document.querySelector('.camera-recording-error-note')?.getAttribute('role') === 'status' && document.querySelector('.footage-provenance')?.innerText.includes('Bundled reference') && !document.querySelector('.footage-provenance')?.innerText.includes('Local camera capture')", message_id + 1, "recorder-error recovery with source and method locks released without replacing active footage")
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === '2 s clip')?.click()", message_id)
    message_id = wait_for(socket, "document.querySelector('.recording-countdown')?.innerText.includes('Recording locally') && !document.querySelector('.camera-recording-error-note') && [...document.querySelectorAll('.sample-row')].every(button => button.disabled) && document.querySelector('.upload-action')?.disabled === true && document.querySelector('.metadata-panel')?.disabled === true", message_id + 1, "post-error recording restart with source and method locks reapplied")
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Stop')?.click()", message_id)
    message_id = wait_for(socket, "!document.querySelector('.recording-countdown') && !document.querySelector('.camera-recording-error-note') && document.querySelector('.footage-provenance')?.innerText.includes('Local camera capture') && document.querySelector('.footage-provenance')?.innerText.includes('Recording stopped') && document.querySelector('.footage-provenance')?.innerText.includes('operator stopped')", message_id + 1, "successful post-error camera capture")
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
    print(json.dumps({"recording_error": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Recording error validation failed: {error}", file=sys.stderr)
        sys.exit(1)
