import json
import sys
import time
from pathlib import Path
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer"
DOWNLOADS = Path("/home/ubuntu/Downloads")


def evaluate(socket, expression, message_id):
    socket.send(json.dumps({"id": message_id, "method": "Runtime.evaluate", "params": {"expression": expression, "returnByValue": True, "awaitPromise": True}}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            if "exceptionDetails" in response.get("result", {}):
                raise RuntimeError(response["result"]["exceptionDetails"].get("text", "Browser evaluation failed"))
            return response.get("result", {}).get("result", {}).get("value")


def click_by_text(socket, text, message_id):
    return evaluate(socket, f"(() => {{ const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes({json.dumps(text)}) && !item.disabled); button?.click(); return Boolean(button); }})()", message_id)


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
    if not click_by_text(socket, "Run analysis", 30):
        raise RuntimeError("Could not start browser-local analysis.")
    for message_id in range(31, 280):
        time.sleep(0.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        if "Analysis complete — review required" in text:
            break
        if "Analysis could not complete" in text:
            raise RuntimeError("Analysis failed before field-stability validation.")
    else:
        raise RuntimeError("Analysis did not complete within the timeout.")
    evidence_visible = evaluate(socket, "document.body.innerText.includes('Field stability') && document.body.innerText.includes('Mean shift')", 281)
    for previous in DOWNLOADS.glob("*-method-manifest.json"):
        previous.unlink()
    if not click_by_text(socket, "Method manifest", 282):
        raise RuntimeError("Method manifest action was unavailable after analysis.")
    for _ in range(20):
        time.sleep(0.25)
        created = list(DOWNLOADS.glob("*-method-manifest.json"))
        if created:
            break
    else:
        raise RuntimeError("Method manifest was not downloaded.")
    manifest = json.loads(created[0].read_text(encoding="utf-8"))
    stability = manifest.get("fieldStability")
    if not evidence_visible or not isinstance(stability, dict) or not {"status", "meanShiftPx", "maxShiftPx", "rationale"}.issubset(stability):
        raise RuntimeError("Field-stability evidence was not fully available in the UI and method manifest.")
    print(json.dumps({"field_stability": "complete", "ui_evidence": evidence_visible, "manifest_status": stability["status"], "manifest": created[0].name}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Field stability validation failed: {error}", file=sys.stderr)
        sys.exit(1)
