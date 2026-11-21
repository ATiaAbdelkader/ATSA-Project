import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-ik6k633ot22nsl8kchkqp-f2db81c8.us5.manus.computer"


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


def check_active_semantics(socket, message_id):
    return evaluate(socket, """(() => {
      const runner = document.querySelector('.analysis-runner');
      const status = document.querySelector('.analysis-status');
      const progress = document.querySelector('[role="progressbar"]');
      return Boolean(runner && status && progress) && runner.getAttribute('aria-busy') === 'true' &&
        status.getAttribute('role') === 'status' && status.getAttribute('aria-live') === 'polite' &&
        progress.getAttribute('aria-label') === 'Browser-local analysis progress' &&
        progress.getAttribute('aria-valuemin') === '0' && progress.getAttribute('aria-valuemax') === '100' &&
        Number(progress.getAttribute('aria-valuenow')) >= 0 && Boolean(progress.getAttribute('aria-valuetext')) &&
        [...document.querySelectorAll('.sample-row')].every(button => button.disabled) &&
        document.querySelector('.upload-action')?.disabled === true &&
        document.querySelector('.privacy-note[role="status"]')?.innerText.includes('Replacement footage controls are locked') &&
        document.querySelector('.metadata-panel')?.disabled === true && document.querySelector('.specimen-workflow-panel')?.disabled === true &&
        document.querySelector('.calibration-wizard-panel')?.disabled === true && document.querySelector('.thresholds-panel')?.disabled === true &&
        document.querySelector('.analysis-input-lock-note')?.innerText.includes('inputs are locked until this browser-local run ends') &&
        document.querySelector('[aria-label="Select microscope camera"]')?.disabled === true && document.querySelector('[aria-label="Refresh local camera device list"]')?.disabled === true &&
        document.querySelector('[aria-label="Select microscope clip duration"]')?.disabled === true &&
        [...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Start preview')?.disabled === true &&
        document.querySelector('.camera-selection-lock-note[role="status"]')?.innerText.includes('Camera preview, still capture, and acquisition settings are locked');
    })()""", message_id)


def validate_viewport(socket, message_id):
    evaluate(socket, "window.__semenScopeOriginalSetTimeout = window.setTimeout.bind(window); window.setTimeout = (callback, delay, ...args) => window.__semenScopeOriginalSetTimeout(callback, Math.max(Number(delay) || 0, 250), ...args)", message_id)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis')?.click()", message_id)
    message_id = wait_for(socket, "Boolean(document.querySelector('[role=\"progressbar\"]'))", message_id + 1, "live progress control")
    message_id = wait_for(socket, "[...document.querySelectorAll('.sample-row')].every(button => button.disabled) && document.querySelector('.upload-action')?.disabled === true && document.querySelector('.privacy-note[role=\"status\"]')?.innerText.includes('Replacement footage controls are locked')", message_id, "replacement-footage control lock")
    if not check_active_semantics(socket, message_id):
        raise RuntimeError("Live processing status did not expose the expected accessibility semantics.")
    evaluate(socket, "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))", message_id + 1)
    message_id = wait_for(socket, "!Boolean(document.querySelector('[role=\"progressbar\"]')) && document.activeElement?.innerText?.trim() === 'Run analysis' && [...document.querySelectorAll('.sample-row')].every(button => !button.disabled) && document.querySelector('.upload-action')?.disabled === false && document.querySelector('.metadata-panel')?.disabled === false && document.querySelector('.specimen-workflow-panel')?.disabled === false && document.querySelector('.calibration-wizard-panel')?.disabled === false && document.querySelector('.thresholds-panel')?.disabled === false && document.querySelector('[aria-label=\"Select microscope camera\"]')?.disabled === false && document.querySelector('[aria-label=\"Refresh local camera device list\"]')?.disabled === false && document.querySelector('[aria-label=\"Select microscope clip duration\"]')?.disabled === false && [...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Start preview')?.disabled === false && !document.querySelector('.analysis-input-lock-note') && !document.querySelector('.privacy-note[role=\"status\"]') && !document.querySelector('.camera-selection-lock-note[role=\"status\"]')", message_id + 2, "cancelled accessible processing state with Run analysis focus and all input and camera controls restored")
    evaluate(socket, "if (window.__semenScopeOriginalSetTimeout) window.setTimeout = window.__semenScopeOriginalSetTimeout", message_id)
    return message_id + 1


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'))", 2, "desktop run control")
    message_id = validate_viewport(socket, message_id)
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, message_id)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", message_id + 1)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'))", message_id + 2, "mobile run control")
    message_id = validate_viewport(socket, message_id)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, message_id)
    socket.close()
    print(json.dumps({"analysis_accessibility": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Analysis accessibility validation failed: {error}", file=sys.stderr)
        sys.exit(1)
