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
            raise RuntimeError("Reference analysis failed before technical-summary copy.")
    else:
        raise RuntimeError("Reference analysis did not complete within the timeout.")
    evaluate(socket, "Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__semenScopeCopiedTechnicalSummary = value; } } })", 261)
    clicked = evaluate(socket, "(() => { const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes('Copy technical summary') && !item.disabled); if (!button) return false; button.click(); return true; })()", 262)
    if not clicked:
        raise RuntimeError("Enabled Copy technical summary control did not render.")
    for message_id in range(263, 283):
        time.sleep(0.15)
        copied = evaluate(socket, "typeof window.__semenScopeCopiedTechnicalSummary === 'string' ? window.__semenScopeCopiedTechnicalSummary : null", message_id)
        if copied:
            break
    else:
        raise RuntimeError("Browser-local technical summary was not copied to the clipboard API.")
    required = ["CURRENT-RUN TECHNICAL SUMMARY", "Trajectory integrity:", "Detector load:", "Candidate-score context:", "not a diagnostic"]
    missing = [item for item in required if item not in copied]
    if missing:
        raise RuntimeError(f"Copied technical summary is missing required context: {missing}")
    print(json.dumps({"current_run_technical_copy": "complete", "browser_local_clipboard": True, "required_context": required}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Current-run technical summary copy validation failed: {error}", file=sys.stderr)
        sys.exit(1)
