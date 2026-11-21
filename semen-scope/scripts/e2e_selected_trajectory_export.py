import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iwvd519yvkeifos54o1zl-ceb6452e.us2.manus.computer"


def evaluate(socket, expression, message_id):
    socket.send(json.dumps({"id": message_id, "method": "Runtime.evaluate", "params": {"expression": expression, "returnByValue": True, "awaitPromise": True}}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            if "exceptionDetails" in response.get("result", {}):
                raise RuntimeError(response["result"]["exceptionDetails"].get("text", "Browser evaluation failed"))
            return response.get("result", {}).get("result", {}).get("value")


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    for message_id in range(2, 30):
        time.sleep(0.2)
        if evaluate(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'))", message_id):
            break
    else:
        raise RuntimeError("Run analysis control did not render.")
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis')?.click()", 30)
    for message_id in range(31, 260):
        time.sleep(0.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        if "Analysis complete — review required" in text:
            break
        if "Analysis could not complete" in text:
            raise RuntimeError("Reference analysis failed before selected-trajectory export.")
    else:
        raise RuntimeError("Reference analysis did not complete within the timeout.")
    selected = evaluate(socket, "(() => { const row = document.querySelector('.track-table tbody tr'); if (!row || !row.innerText.includes('TRK-')) return false; row.click(); return true; })()", 261)
    if not selected:
        raise RuntimeError("Could not select a completed local trajectory from the review table.")
    for message_id in range(262, 282):
        time.sleep(0.15)
        if evaluate(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.includes('Selected trajectory CSV') && !item.disabled))", message_id):
            break
    else:
        raise RuntimeError("Selected trajectory CSV control did not enable after selection.")
    evaluate(socket, "(() => { const original = URL.createObjectURL.bind(URL); URL.createObjectURL = blob => { window.__semenScopeSelectedTrajectoryCsvBlob = blob; return original(blob); }; const originalClick = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function() { window.__semenScopeSelectedTrajectoryName = this.download; return originalClick.call(this); }; })()", 283)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.includes('Selected trajectory CSV'))?.click()", 284)
    for message_id in range(285, 305):
        time.sleep(0.15)
        content = evaluate(socket, "window.__semenScopeSelectedTrajectoryCsvBlob instanceof Blob ? window.__semenScopeSelectedTrajectoryCsvBlob.text() : null", message_id)
        if content:
            break
    else:
        raise RuntimeError("Selected-trajectory CSV blob was not generated.")
    valid = evaluate(socket, "window.__semenScopeSelectedTrajectoryName && /-trajectory\\.csv$/.test(window.__semenScopeSelectedTrajectoryName)", 306)
    required = ["track_id", "trajectory_integrity_summary", "laboratory review only"]
    missing = [item for item in required if item not in content]
    if not valid or missing:
        raise RuntimeError(f"Selected-trajectory CSV is incomplete: filename={valid}, missing={missing}")
    print(json.dumps({"selected_trajectory_export": "complete", "browser_generated_csv": True, "required_audit_fields": required}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Selected-trajectory export validation failed: {error}", file=sys.stderr)
        sys.exit(1)
