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
    expression = f"""(() => {{ const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes({json.dumps(text)})); if (!button || button.disabled) return false; button.click(); return true; }})()"""
    if not evaluate(socket, expression, message_id):
        raise RuntimeError(f"Could not activate the {text} action.")


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
            raise RuntimeError("Reference analysis failed before coordinate export.")
    else:
        raise RuntimeError("Reference analysis did not complete within the timeout.")
    if not evaluate(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.includes('Trajectory CSV') && !item.disabled))", 261):
        raise RuntimeError("Trajectory CSV action was not enabled after analysis.")
    evaluate(socket, "(() => { const originalCreateObjectUrl = URL.createObjectURL.bind(URL); URL.createObjectURL = blob => { window.__semenScopeTrajectoryCsvBlob = blob; return originalCreateObjectUrl(blob); }; })()", 262)
    click(socket, "Trajectory CSV", 262)
    for _ in range(20):
        time.sleep(0.25)
        content = evaluate(socket, "window.__semenScopeTrajectoryCsvBlob instanceof Blob ? window.__semenScopeTrajectoryCsvBlob.text() : null", 263 + _)
        if content:
            break
    else:
        raise RuntimeError("Trajectory coordinate CSV blob was not generated.")
    required = ["track_id", "x_microns", "threshold_signature", "output_fingerprint", "not a cryptographic signature", "trajectory_integrity_summary", "trajectory_integrity_attention_items", "trajectory_integrity_notice", "Technical trajectory-integrity context only", "laboratory review only"]
    missing = [item for item in required if item not in content]
    if missing:
        raise RuntimeError(f"Trajectory coordinate CSV is missing required audit fields: {missing}")
    print(json.dumps({"trajectory_coordinate_export": "complete", "browser_generated_csv": True, "required_audit_fields": required}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Trajectory coordinate export validation failed: {error}", file=sys.stderr)
        sys.exit(1)
