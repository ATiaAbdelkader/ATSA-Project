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


def run_cancel_rerun(socket, message_id):
    evaluate(socket, "window.__semenScopeOriginalSetTimeout = window.setTimeout.bind(window); window.setTimeout = (callback, delay, ...args) => window.__semenScopeOriginalSetTimeout(callback, Math.max(Number(delay) || 0, 250), ...args)", message_id)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis')?.click()", message_id)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim().startsWith('Cancel run'))) && document.querySelector('.temporary-session-reset')?.disabled === true && document.querySelector('.temporary-session-reset-note')?.innerText.includes('locked while local analysis')", message_id + 1, "Cancel run control and session-reset lock")
    evaluate(socket, "(() => { const inputs = document.querySelectorAll('.metadata-panel input'); const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set; if (!setValue) return; setValue.call(inputs[0], 'Changed after run start'); inputs[0].dispatchEvent(new Event('input', { bubbles: true })); setValue.call(inputs[1], '9'); inputs[1].dispatchEvent(new Event('input', { bubbles: true })); })()", message_id)
    message_id = wait_for(socket, "document.querySelector('.metadata-panel input')?.value === 'Changed after run start' && document.querySelector('.analysis-run-context')?.innerText.includes('Active run basis locked · Reference field 03 · Bovine') && !document.querySelector('.analysis-run-context')?.innerText.includes('Changed after run start') && !document.querySelector('.analysis-run-context')?.innerText.includes('9 µm/px')", message_id + 1, "frozen active-analysis sample and calibration context")
    message_id = wait_for(socket, "(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })()", message_id, "active-analysis exit warning")
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim().startsWith('Cancel run'))?.click()", message_id)
    message_id = wait_for(socket, "document.body.innerText.includes('Analysis cancelled — no new result was created.') && Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis')) && !document.querySelector('.analysis-run-context') && document.querySelector('.temporary-session-reset')?.disabled === false && !document.querySelector('.temporary-session-reset-note') && !(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })()", message_id + 1, "cancelled analysis state with frozen-context, exit-warning, and session-reset cleanup")
    evaluate(socket, "if (window.__semenScopeOriginalSetTimeout) window.setTimeout = window.__semenScopeOriginalSetTimeout", message_id)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.includes('Reference field 02'))?.click()", message_id)
    message_id = wait_for(socket, "!document.body.innerText.includes('Analysis cancelled — no new result was created.') && document.querySelector('.sample-row.selected strong')?.textContent?.trim() === 'Reference field 02'", message_id + 1, "replacement footage staging state")
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis')?.click()", message_id)
    message_id = wait_for(socket, "document.body.innerText.includes('Analysis complete — review required')", message_id + 1, "completed rerun")
    message_id = wait_for(socket, "document.querySelector('.trajectory-integrity[aria-label=\"Trajectory integrity technical evidence\"]')?.innerText.includes('Retained-track technical scorecard') && document.querySelector('.trajectory-integrity')?.innerText.includes('Technical trajectory-integrity context only')", message_id, "visible trajectory-integrity technical review panel")
    evaluate(socket, "[...document.querySelectorAll('.technical-evidence-navigator button')].find(button => button.innerText.trim() === 'Integrity')?.click()", message_id + 1)
    message_id = wait_for(socket, "document.activeElement?.id === 'analysis-trajectory-integrity-evidence' && getComputedStyle(document.activeElement).outlineStyle === 'solid' && parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 3 && [...document.querySelectorAll('.technical-evidence-navigator button')].find(button => button.innerText.trim() === 'Integrity')?.getAttribute('aria-current') === 'location'", message_id + 2, "visible selected trajectory-integrity evidence navigator focus")
    evaluate(socket, "[...document.querySelectorAll('.technical-evidence-navigator button')].find(button => button.innerText.trim() === 'Association')?.click()", message_id + 1)
    message_id = wait_for(socket, "document.activeElement?.id === 'analysis-confidence-evidence' && getComputedStyle(document.activeElement).outlineStyle === 'solid' && parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 3 && [...document.querySelectorAll('.technical-evidence-navigator button')].find(button => button.innerText.trim() === 'Association')?.getAttribute('aria-current') === 'location' && ![...document.querySelectorAll('.technical-evidence-navigator button')].find(button => button.innerText.trim() === 'Integrity')?.hasAttribute('aria-current')", message_id + 2, "visible selected association evidence navigator focus")
    evaluate(socket, "[...document.querySelectorAll('.technical-evidence-navigator button')].find(button => button.innerText.trim() === 'Detector load')?.click()", message_id + 1)
    message_id = wait_for(socket, "document.activeElement?.id === 'analysis-detector-load-evidence' && getComputedStyle(document.activeElement).outlineStyle === 'solid' && parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 3 && [...document.querySelectorAll('.technical-evidence-navigator button')].find(button => button.innerText.trim() === 'Detector load')?.getAttribute('aria-current') === 'location' && ![...document.querySelectorAll('.technical-evidence-navigator button')].find(button => button.innerText.trim() === 'Association')?.hasAttribute('aria-current')", message_id + 2, "visible selected detector-load evidence navigator focus")
    evaluate(socket, "[...document.querySelectorAll('.technical-evidence-navigator button')].find(button => button.innerText.trim() === 'Candidate scores')?.click()", message_id + 1)
    message_id = wait_for(socket, "document.activeElement?.id === 'analysis-candidate-score-evidence' && getComputedStyle(document.activeElement).outlineStyle === 'solid' && parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 3 && [...document.querySelectorAll('.technical-evidence-navigator button')].find(button => button.innerText.trim() === 'Candidate scores')?.getAttribute('aria-current') === 'location' && ![...document.querySelectorAll('.technical-evidence-navigator button')].find(button => button.innerText.trim() === 'Detector load')?.hasAttribute('aria-current')", message_id + 2, "visible selected candidate-score evidence navigator focus")
    evaluate(socket, "(() => { const input = document.querySelectorAll('.metadata-panel input')[1]; const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set; if (!input || !setValue) return; setValue.call(input, '8'); input.dispatchEvent(new Event('input', { bubbles: true })); })()", message_id)
    message_id = wait_for(socket, "document.querySelectorAll('.metadata-panel input')[1]?.value === '8' && document.querySelector('.analysis-run-context-mismatch')?.innerText.includes('Current workspace settings differ from this completed run') && document.querySelector('.analysis-run-context-mismatch')?.getAttribute('role') === 'status'", message_id + 1, "completed-run context mismatch guidance")
    evaluate(socket, "(() => { const context = document.querySelector('.analysis-run-context')?.innerText || ''; window.__semenScopeFrozenSummaryCalibration = context.match(/· ([0-9.]+) µm\\/px ·/)?.[1]; window.__semenScopeFrozenSummaryFingerprint = context.match(/· (SS-[A-Z0-9-]+)$/)?.[1]; const originalCreateObjectUrl = URL.createObjectURL.bind(URL); URL.createObjectURL = blob => { window.__semenScopeLastSummaryBlob = blob; return originalCreateObjectUrl(blob); }; })()", message_id)
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Download summary')?.click()", message_id + 1)
    message_id = wait_for(socket, "window.__semenScopeLastSummaryBlob instanceof Blob", message_id + 2, "browser-local summary blob")
    message_id = wait_for(socket, "window.__semenScopeLastSummaryBlob.text().then(text => Boolean(window.__semenScopeFrozenSummaryCalibration) && Boolean(window.__semenScopeFrozenSummaryFingerprint) && text.includes('Sample: Reference field 02') && text.includes(`Calibration: ${window.__semenScopeFrozenSummaryCalibration} µm/px`) && text.includes(`Method fingerprint: ${window.__semenScopeFrozenSummaryFingerprint}`) && !text.includes('Calibration: 8 µm/px'))", message_id, "frozen sample and method context in browser-local summary export")
    evaluate(socket, "(() => { const originalCreateObjectUrl = URL.createObjectURL.bind(URL); URL.createObjectURL = blob => { window.__semenScopeLastManifestBlob = blob; return originalCreateObjectUrl(blob); }; })()", message_id)
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.includes('Method manifest'))?.click()", message_id + 1)
    message_id = wait_for(socket, "window.__semenScopeLastManifestBlob instanceof Blob", message_id + 2, "browser-local method manifest blob")
    message_id = wait_for(socket, "window.__semenScopeLastManifestBlob.text().then(text => { const manifest = JSON.parse(text); return Boolean(manifest.trajectoryIntegrity?.summaryLine) && Array.isArray(manifest.trajectoryIntegrity?.attentionItems) && String(manifest.trajectoryIntegrityNotice || '').includes('does not establish tracking accuracy'); })", message_id, "trajectory-integrity context in browser-local method manifest")
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis')?.click()", message_id + 1)
    message_id = wait_for(socket, "document.body.innerText.includes('Analysis complete — review required') && !document.querySelector('.technical-evidence-navigator [aria-current=\"location\"]')", message_id + 2, "technical-evidence navigator selection reset for replacement analysis output")
    return message_id


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'))", 2, "desktop run control")
    message_id = run_cancel_rerun(socket, message_id)
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, message_id)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", message_id + 1)
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'))", message_id + 2, "mobile run control")
    message_id = run_cancel_rerun(socket, message_id)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, message_id)
    socket.close()
    print(json.dumps({"analysis_cancellation": "complete", "desktop_cancel_and_rerun": True, "mobile_cancel_and_rerun": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Analysis cancellation validation failed: {error}", file=sys.stderr)
        sys.exit(1)
