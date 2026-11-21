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
    for message_id in range(start_message_id, start_message_id + 120):
        time.sleep(0.12)
        if evaluate(socket, expression, message_id):
            return message_id + 1
    raise RuntimeError(f"Timed out waiting for {description}.")


def install_recording_mocks(socket, message_id):
    evaluate(socket, """(() => {
      HTMLMediaElement.prototype.play = async () => undefined;
      Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { configurable: true, get: () => 1280 });
      Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { configurable: true, get: () => 720 });
      const originalLoad = HTMLMediaElement.prototype.load;
      HTMLMediaElement.prototype.load = function() {
        if (this instanceof HTMLVideoElement && this.src.startsWith('blob:')) {
          Object.defineProperty(this, 'readyState', { configurable: true, get: () => HTMLMediaElement.HAVE_METADATA });
          Object.defineProperty(this, 'duration', { configurable: true, get: () => 1 });
          queueMicrotask(() => this.dispatchEvent(new Event('loadedmetadata')));
          return;
        }
        return originalLoad.call(this);
      };
      const createStream = (label) => {
        const listeners = new Set();
        const track = {
          label,
          stop: () => undefined,
          getSettings: () => ({ width: 1280, height: 720 }),
          addEventListener: (type, listener) => { if (type === 'ended') listeners.add(listener); },
          removeEventListener: (type, listener) => { if (type === 'ended') listeners.delete(listener); },
          endForTest: () => listeners.forEach(listener => listener()),
        };
        const stream = new MediaStream();
        Object.defineProperty(stream, 'getVideoTracks', { configurable: true, value: () => [track] });
        Object.defineProperty(stream, 'getTracks', { configurable: true, value: () => [track] });
        window.__semenScopeMockCameraTrack = track;
        return stream;
      };
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async constraints => { if (window.__semenScopeThrowOnGetUserMedia) throw new Error('Simulated camera preview access failure'); return createStream(constraints?.video?.deviceId?.exact === 'camera-2' ? 'Later selection' : 'Active microscope stream'); } });
      Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', { configurable: true, value: async () => [
        { deviceId: 'camera-1', kind: 'videoinput', label: 'Active microscope stream' },
        { deviceId: 'camera-2', kind: 'videoinput', label: 'Later selection' },
      ] });
      class TestMediaRecorder {
        constructor(stream, options) { if (window.__semenScopeThrowOnRecorderConstruct) throw new Error('Simulated recorder initialization failure'); this.state = 'inactive'; this.mimeType = options?.mimeType || 'video/webm'; window.__semenScopeRecorderMimeType = this.mimeType; window.__semenScopeMockRecorder = this; }
        start() { this.state = 'recording'; }
        stop() { if (this.state !== 'recording') return; this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['test'], { type: this.mimeType }) }); this.onstop?.(); }
        failForTest() { if (this.state !== 'recording') return; this.state = 'inactive'; this.onerror?.(new Event('error')); this.onstop?.(); }
      }
      Object.defineProperty(TestMediaRecorder, 'isTypeSupported', { configurable: true, value: mimeType => mimeType === 'video/webm;codecs=vp8,opus' });
      Object.defineProperty(window, 'MediaRecorder', { configurable: true, value: TestMediaRecorder });
    })()""", message_id)


def validate_viewport(socket, message_id):
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Start preview'))", message_id, "camera preview control")
    install_recording_mocks(socket, message_id)
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Start preview')?.click()", message_id + 1)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === '2 s clip'))", message_id + 2, "camera capture control")
    message_id = wait_for(socket, "Boolean(document.querySelector('[aria-label=\"Select microscope camera\"] option[value=\"camera-2\"]'))", message_id, "enumerated alternate camera option")
    message_id = wait_for(socket, "document.querySelector('.active-camera-preview-label')?.innerText.includes('Active microscope stream')", message_id, "active stream label during preview")
    evaluate(socket, "window.__semenScopeMockCameraTrack?.endForTest()", message_id)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Start preview')) && !document.querySelector('.active-camera-preview-label') && !document.querySelector('.active-camera-selection-notice')", message_id + 1, "unexpected stream-end cleanup")
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Start preview')?.click()", message_id)
    message_id = wait_for(socket, "document.querySelector('.active-camera-preview-label')?.innerText.includes('Active microscope stream')", message_id + 1, "camera preview recovery after stream end")
    evaluate(socket, "(() => { const select = document.querySelector('[aria-label=\"Select microscope camera\"]'); select.value = 'camera-2'; select.dispatchEvent(new Event('change', { bubbles: true })); })()", message_id)
    message_id = wait_for(socket, "document.querySelector('[aria-label=\"Select microscope camera\"]')?.value === 'camera-2' && document.querySelector('.active-camera-preview-label')?.innerText.includes('Active microscope stream') && !document.querySelector('.active-camera-preview-label')?.innerText.includes('Later selection') && document.querySelector('.active-camera-selection-notice')?.innerText.includes('Selected camera differs from the active stream') && document.querySelector('.active-camera-selection-notice')?.getAttribute('role') === 'status' && Boolean([...document.querySelectorAll('.active-camera-selection-notice button')].find(button => button.innerText.trim() === 'Restart with selected camera'))", message_id + 1, "later device selection mismatch guidance and restart action without replacing the active stream context")
    evaluate(socket, "[...document.querySelectorAll('.active-camera-selection-notice button')].find(button => button.innerText.trim() === 'Restart with selected camera')?.click()", message_id)
    message_id = wait_for(socket, "document.querySelector('[aria-label=\"Select microscope camera\"]')?.value === 'camera-2' && document.querySelector('.active-camera-preview-label')?.innerText.includes('Later selection') && !document.querySelector('.active-camera-preview-label')?.innerText.includes('Active microscope stream') && !document.querySelector('.active-camera-selection-notice')", message_id + 1, "selected-device preview restart")
    evaluate(socket, "(() => { const select = document.querySelector('[aria-label=\"Select microscope clip duration\"]'); select.value = '5'; select.dispatchEvent(new Event('change', { bubbles: true })); })()", message_id)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === '5 s clip'))", message_id + 1, "updated five-second capture control")
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === '5 s clip')?.click()", message_id)
    message_id = wait_for(socket, "document.querySelector('.recording-countdown')?.innerText.includes('Recording locally') && document.querySelector('.recording-countdown')?.getAttribute('role') === 'status' && document.querySelector('[aria-label=\"Select microscope camera\"]')?.disabled === true && document.querySelector('[aria-label=\"Refresh local camera device list\"]')?.disabled === true && document.querySelector('[aria-label=\"Select microscope clip duration\"]')?.disabled === true && document.querySelector('.temporary-session-reset')?.disabled === true && document.querySelector('.temporary-session-reset-note')?.innerText.includes('locked while local camera recording') && document.querySelector('.temporary-session-reset-note')?.getAttribute('role') === 'status' && document.querySelector('.camera-selection-lock-note')?.innerText.includes('still capture') && document.querySelector('.camera-selection-lock-note')?.innerText.includes('local camera recording') && document.querySelector('.camera-selection-lock-note')?.getAttribute('role') === 'status' && [...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Still')?.disabled === true && [...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Still')?.title.includes('Stop the active local camera recording') && [...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Stop')?.title === 'Stop camera preview and finalize the local clip' && [...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Stop')?.getAttribute('aria-label') === 'Stop camera preview and finalize the local clip' && [...document.querySelectorAll('.lab-nav button')].filter(button => button.innerText.trim() !== 'Analysis workspace').every(button => button.disabled && button.title.includes('Stop the active local camera recording')) && [...document.querySelectorAll('.sample-row')].every(button => button.disabled) && document.querySelector('.upload-action')?.disabled === true && document.querySelector('.privacy-note[role=\"status\"]')?.innerText.includes('locked while local camera recording') && document.querySelector('.metadata-panel')?.disabled === true && document.querySelector('.specimen-workflow-panel')?.disabled === true && document.querySelector('.calibration-wizard-panel')?.disabled === true && document.querySelector('.thresholds-panel')?.disabled === true && document.querySelector('.analysis-input-lock-note')?.innerText.includes('locked until local camera recording ends') && [...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Run analysis')?.disabled === true && [...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Run analysis')?.title.includes('Stop the active local camera recording') && window.__semenScopeRecorderMimeType === 'video/webm;codecs=vp8,opus' && (() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })()", message_id + 1, "recording countdown, navigation, source, method, analysis, still-capture, and device locks, active-work exit warning, accessible guidance, and supported recorder format")
    time.sleep(1.1)
    progressing = evaluate(socket, "Number((document.querySelector('.recording-countdown strong')?.textContent || '').replace(/[^0-9]/g, '')) <= 4", message_id)
    if not progressing:
        raise RuntimeError("Recording countdown did not progress while the local capture was active.")
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Stop')?.click()", message_id + 1)
    message_id = wait_for(socket, "!document.querySelector('.recording-countdown') && !document.querySelector('.camera-selection-lock-note') && document.querySelector('[aria-label=\"Select microscope camera\"]')?.disabled === false && document.querySelector('[aria-label=\"Refresh local camera device list\"]')?.disabled === false && document.querySelector('[aria-label=\"Select microscope clip duration\"]')?.disabled === false && document.querySelector('.temporary-session-reset')?.disabled === false && !document.querySelector('.temporary-session-reset-note') && [...document.querySelectorAll('.lab-nav button')].every(button => !button.disabled) && [...document.querySelectorAll('.sample-row')].every(button => !button.disabled) && document.querySelector('.upload-action')?.disabled === false && document.querySelector('.metadata-panel')?.disabled === false && document.querySelector('.specimen-workflow-panel')?.disabled === false && document.querySelector('.calibration-wizard-panel')?.disabled === false && document.querySelector('.thresholds-panel')?.disabled === false && !document.querySelector('.analysis-input-lock-note') && !document.querySelector('.privacy-note[role=\"status\"]') && [...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Run analysis')?.disabled === false && Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === '5 s clip')) && ![...document.querySelectorAll('.camera-controls button')].find(button => button.innerText.trim() === 'Stop') && document.activeElement?.innerText?.trim() === 'Start preview' && !document.querySelector('.active-camera-preview-label') && !document.querySelector('.active-camera-selection-notice') && document.querySelector('.footage-provenance')?.innerText.includes('Local camera capture') && document.querySelector('.footage-provenance')?.innerText.includes('WebM') && document.querySelector('.footage-provenance')?.innerText.includes('Later selection') && document.querySelector('.footage-provenance')?.innerText.includes('Captured at') && document.querySelector('.footage-provenance')?.innerText.includes('Capture frame') && document.querySelector('.footage-provenance')?.innerText.includes('1280 × 720 px') && document.querySelector('.footage-provenance')?.innerText.includes('Recorder format') && document.querySelector('.footage-provenance')?.innerText.includes('video/webm;codecs=vp8,opus') && document.querySelector('.footage-provenance')?.innerText.includes('Requested clip') && document.querySelector('.footage-provenance')?.innerText.includes('Actual local recording') && document.querySelector('.footage-provenance')?.innerText.includes('Recording stopped') && document.querySelector('.footage-provenance')?.innerText.includes('operator stopped') && document.querySelector('.footage-provenance')?.innerText.includes('5 s') && !document.querySelector('.footage-provenance')?.innerText.includes('Active microscope stream') && !document.querySelector('.footage-provenance')?.innerText.includes('not recorded') && !(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })()", message_id + 2, "preview teardown, recording cleanup, navigation, source, method, analysis, and device control unlock, exit-warning cleanup, and capture-frame provenance")
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Start preview')?.click()", message_id)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === '5 s clip')) && document.querySelector('.active-camera-preview-label')?.innerText.includes('Later selection')", message_id + 1, "camera preview before stream-end recording recovery")
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === '5 s clip')?.click()", message_id)
    message_id = wait_for(socket, "document.querySelector('.recording-countdown')?.innerText.includes('Recording locally') && document.querySelector('[aria-label=\"Select microscope camera\"]')?.disabled === true && [...document.querySelectorAll('.sample-row')].every(button => button.disabled) && document.querySelector('.metadata-panel')?.disabled === true", message_id + 1, "active recording before unexpected stream end")
    evaluate(socket, "window.__semenScopeMockCameraTrack?.endForTest()", message_id)
    message_id = wait_for(socket, "!document.querySelector('.recording-countdown') && document.activeElement?.innerText?.trim() === 'Start preview' && Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Start preview')) && !document.querySelector('.active-camera-preview-label') && !document.querySelector('.camera-selection-lock-note') && document.querySelector('[aria-label=\"Select microscope camera\"]')?.disabled === false && document.querySelector('[aria-label=\"Select microscope clip duration\"]')?.disabled === false && [...document.querySelectorAll('.sample-row')].every(button => !button.disabled) && document.querySelector('.upload-action')?.disabled === false && document.querySelector('.metadata-panel')?.disabled === false && document.querySelector('.specimen-workflow-panel')?.disabled === false && document.querySelector('.calibration-wizard-panel')?.disabled === false && document.querySelector('.thresholds-panel')?.disabled === false && !document.querySelector('.analysis-input-lock-note') && !document.querySelector('.privacy-note[role=\"status\"]') && [...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Run analysis')?.disabled === true && [...document.querySelectorAll('.partial-capture-review-note[role=\"alert\"]')].some(note => note.innerText.includes('Partial local camera clip') && note.innerText.includes('active stream ended')) && Boolean([...document.querySelectorAll('.partial-capture-review-note button')].find(button => button.innerText.trim() === 'Acknowledge technical review')) && document.querySelector('.footage-provenance')?.innerText.includes('Local camera capture') && document.querySelector('.footage-provenance')?.innerText.includes('Later selection') && document.querySelector('.footage-provenance')?.innerText.includes('Requested clip') && document.querySelector('.footage-provenance')?.innerText.includes('5 s') && document.querySelector('.footage-provenance')?.innerText.includes('Actual local recording') && document.querySelector('.footage-provenance')?.innerText.includes('Recording stopped') && document.querySelector('.footage-provenance')?.innerText.includes('active camera stream ended') && !document.querySelector('.footage-provenance')?.innerText.includes('operator stopped') && !(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })()", message_id + 1, "unexpected-stream-end cleanup, Start preview focus restoration, partial footage provenance, and technical-review acknowledgement guard")
    evaluate(socket, "[...document.querySelectorAll('.partial-capture-review-note button')].find(button => button.innerText.trim() === 'Acknowledge technical review')?.click()", message_id)
    message_id = wait_for(socket, "!document.querySelector('.partial-capture-review-note') && document.querySelector('.partial-capture-acknowledged[role=\"status\"]')?.innerText.includes('Technical review acknowledged locally') && document.querySelector('.partial-capture-acknowledged')?.innerText.includes('does not confirm footage quality') && [...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Run analysis')?.disabled === false", message_id + 1, "visible partial-capture acknowledgement confirmation restores local analysis availability")
    evaluate(socket, "(() => { const input = document.querySelector('.metadata-panel input[type=\"number\"]'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, String(Number(input.value) + 0.01)); input.dispatchEvent(new Event('input', { bubbles: true })); })()", message_id)
    message_id = wait_for(socket, "[...document.querySelectorAll('.partial-capture-review-note[role=\"alert\"]')].some(note => note.innerText.includes('Method changed after technical review') && note.innerText.includes('current method draft differs')) && !document.querySelector('.partial-capture-acknowledged') && [...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Run analysis')?.disabled === true", message_id + 1, "method change invalidates the earlier partial-capture acknowledgement")
    evaluate(socket, "[...document.querySelectorAll('.partial-capture-review-note button')].find(button => button.innerText.trim() === 'Acknowledge technical review')?.click()", message_id)
    message_id = wait_for(socket, "!document.querySelector('.partial-capture-review-note') && document.querySelector('.partial-capture-acknowledged[role=\"status\"]')?.innerText.includes('Technical review acknowledged locally') && [...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Run analysis')?.disabled === false", message_id + 1, "renewed partial-capture acknowledgement restores local analysis availability for the changed method")
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
    print(json.dumps({"recording_countdown": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Recording countdown validation failed: {error}", file=sys.stderr)
        sys.exit(1)
