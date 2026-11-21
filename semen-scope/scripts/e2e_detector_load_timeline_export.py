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


def click(socket, text, message_id):
    if not evaluate(socket, f"(() => {{ const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes({json.dumps(text)}) && !item.disabled); if (!button) return false; button.click(); return true; }})()", message_id):
        raise RuntimeError(f"Could not activate {text}.")


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
    click(socket, "Run analysis", 30)
    for message_id in range(31, 260):
        time.sleep(0.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        if "Analysis complete — review required" in text:
            break
        if "Analysis could not complete" in text:
            raise RuntimeError("Reference analysis failed before detector-load export.")
    else:
        raise RuntimeError("Reference analysis did not complete within the timeout.")
    evaluate(socket, "(() => { const original = URL.createObjectURL.bind(URL); URL.createObjectURL = blob => { window.__semenScopeDetectorLoadCsvBlob = blob; return original(blob); }; })()", 261)
    click(socket, "Detector load CSV", 262)
    for message_id in range(263, 283):
        time.sleep(0.2)
        content = evaluate(socket, "window.__semenScopeDetectorLoadCsvBlob instanceof Blob ? window.__semenScopeDetectorLoadCsvBlob.text() : null", message_id)
        if content:
            break
    else:
        raise RuntimeError("Detector-load CSV blob was not generated.")
    required = ["candidate_limit_per_frame", "source_frame", "candidate_count", "at_selection_cap", "not a concentration, cell-count", "not a cryptographic signature"]
    missing = [item for item in required if item not in content]
    if missing:
        raise RuntimeError(f"Detector-load CSV is missing required audit fields: {missing}")
    print(json.dumps({"detector_load_timeline_export": "complete", "browser_generated_csv": True, "required_audit_fields": required}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Detector-load timeline export validation failed: {error}", file=sys.stderr)
        sys.exit(1)
