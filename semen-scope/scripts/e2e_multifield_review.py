import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-i1zkd2g8v1etu89ecml0k-26194f07.us2.manus.computer"
REFERENCE_VIDEO = "/manus-storage/reference-3-h264_2a900d9c.mp4"


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
            if "error" in response:
                raise RuntimeError(response["error"].get("message", "DevTools command failed"))
            return response.get("result", {})


def click(socket, text, message_id):
    result = evaluate(socket, f"""(() => {{ const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes({json.dumps(text)})); if (!button || button.disabled) return false; button.click(); return true; }})()""", message_id)
    if not result:
        raise RuntimeError(f"Could not click enabled '{text}' control.")


def upload_field(socket, name, message_id):
    return evaluate(socket, f"""(async () => {{
      const input = [...document.querySelectorAll('input[type=file]')].find(item => item.accept.includes('video'));
      if (!input) throw new Error('Video upload input not found');
      const response = await fetch({json.dumps(REFERENCE_VIDEO)});
      const blob = await response.blob();
      const data = new DataTransfer();
      data.items.add(new File([blob], {json.dumps(name)}, {{ type: 'video/mp4' }}));
      input.files = data.files;
      input.dispatchEvent(new Event('change', {{ bubbles: true }}));
      return true;
    }})()""", message_id)


def wait_for_analysis(socket, start_id):
    deadline = time.time() + 40
    message_id = start_id
    while time.time() < deadline:
        time.sleep(0.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        message_id += 1
        if "Analysis complete — review required" in text:
            return message_id
        if "Analysis could not complete" in text:
            raise RuntimeError("Local field analysis failed.")
    raise RuntimeError("Local field analysis did not complete within the timeout.")


def run_multi_field_review(socket, start_id):
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", start_id)
    for message_id in range(start_id + 1, start_id + 30):
        time.sleep(0.2)
        if evaluate(socket, "document.body.innerText.includes('Repeatability check')", message_id):
            break
    else:
        raise RuntimeError("Multi-field repeatability panel did not render.")

    upload_field(socket, "field-a.mp4", start_id + 30)
    time.sleep(1)
    click(socket, "Run analysis", start_id + 31)
    next_id = wait_for_analysis(socket, start_id + 32)
    evaluate(socket, "(() => { const input = document.querySelector('.metadata-panel input'); const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set; if (!input || !setValue) return false; setValue.call(input, 'Edited after field A run'); input.dispatchEvent(new Event('input', { bubbles: true })); return input.value; })()", next_id)
    click(socket, "Add current analyzed field", next_id)
    time.sleep(0.3)
    first_added = evaluate(socket, "(() => { const label = document.querySelector('.multi-field-list > div strong')?.textContent || ''; const integrity = document.querySelector('.multi-field-trajectory-integrity')?.textContent || ''; const attention = document.querySelector('.multi-field-trajectory-integrity-attention')?.textContent || ''; const safeguard = document.querySelector('.multi-field-trajectory-integrity-safeguard')?.textContent || ''; return label.includes('1. field-a') && !label.includes('Edited after field A run') && integrity.includes('Trajectory integrity:') && integrity.includes('nominal links') && attention.includes('Technical attention:') && safeguard.includes('Technical trajectory-integrity context only'); })()", next_id + 1)
    if not first_added:
        raise RuntimeError("First uploaded field was not added to the local repeatability set.")
    evaluate(socket, "(() => { const original = URL.createObjectURL.bind(URL); URL.createObjectURL = blob => { window.__semenScopeMultiFieldCsvBlob = blob; return original(blob); }; })()", next_id + 2)
    click(socket, "Export field review CSV", next_id + 3)
    for message_id in range(next_id + 4, next_id + 24):
        time.sleep(0.15)
        exported_csv = evaluate(socket, "window.__semenScopeMultiFieldCsvBlob instanceof Blob ? window.__semenScopeMultiFieldCsvBlob.text() : null", message_id)
        if exported_csv:
            break
    else:
        raise RuntimeError("Browser-local multi-field technical review CSV blob was not generated.")
    if not all(item in exported_csv for item in ["field_label", "trajectory_integrity_summary", "not_ready", "does not pool measurements"]):
        raise RuntimeError("Browser-local multi-field technical review CSV is missing required review context.")

    upload_field(socket, "field-b.mp4", next_id + 24)
    time.sleep(1)
    click(socket, "Run analysis", next_id + 3)
    next_id = wait_for_analysis(socket, next_id + 4)
    click(socket, "Add current analyzed field", next_id)
    time.sleep(0.3)
    blocker_before_confirm = evaluate(socket, "document.body.innerText.includes('Confirm that all selected fields')", next_id + 1)
    confirmed = evaluate(socket, "(() => { const input = document.querySelector('.same-specimen-check input'); if (!input || input.disabled) return false; input.click(); return input.checked; })()", next_id + 2)
    if not confirmed:
        raise RuntimeError("Could not activate the same-specimen confirmation safeguard.")
    time.sleep(0.3)
    completed = evaluate(socket, "(() => { const text = document.body.innerText; return text.includes('2 fields') && text.includes('mean ± sample SD') && text.includes('Technical repeatability only'); })()", next_id + 3)
    if not blocker_before_confirm or not completed:
        raise RuntimeError(f"Multi-field safeguard or summary did not render: blocker={blocker_before_confirm}, summary={completed}")
    return {"first_added": first_added, "browser_local_csv": True, "confirmation_safeguard": blocker_before_confirm, "summary": completed}


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    desktop = run_multi_field_review(socket, 1)
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, 500)
    mobile = run_multi_field_review(socket, 600)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, 1200)
    print(json.dumps({"multi_field_review": "complete", "desktop": desktop, "mobile_375x812": mobile}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Multi-field review validation failed: {error}", file=sys.stderr)
        sys.exit(1)
