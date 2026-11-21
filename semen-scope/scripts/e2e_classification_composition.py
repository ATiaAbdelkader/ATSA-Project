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
            if "exceptionDetails" in response.get("result", {}): raise RuntimeError(response["result"]["exceptionDetails"].get("text", "Browser evaluation failed"))
            return response.get("result", {}).get("result", {}).get("value")

def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response: target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    for message_id in range(2, 30):
        time.sleep(.2)
        if evaluate(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'))", message_id): break
    else: raise RuntimeError("Run analysis control did not render.")
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis')?.click()", 30)
    for message_id in range(31, 280):
        time.sleep(.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        if "Analysis complete — review required" in text: break
    else: raise RuntimeError("Analysis did not complete.")
    visible = evaluate(socket, "document.body.innerText.includes('CLASSIFICATION COMPOSITION') && document.body.innerText.includes('motile, non-progressive')", 281)
    for file in DOWNLOADS.glob("*-method-manifest.json"): file.unlink()
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.includes('Method manifest'))?.click()", 282)
    for _ in range(20):
        time.sleep(.25)
        files = list(DOWNLOADS.glob("*-method-manifest.json"))
        if files: break
    else: raise RuntimeError("Method manifest did not download.")
    composition = json.loads(files[0].read_text()).get("classificationComposition")
    if not visible or not isinstance(composition, dict) or not {"total", "progressive", "motileNonProgressive", "nonMotile"}.issubset(composition): raise RuntimeError("Classification composition was missing from the UI or manifest.")
    print(json.dumps({"classification_composition": "complete", "ui_evidence": visible, "total": composition["total"]}, indent=2))

if __name__ == "__main__":
    try: main()
    except Exception as error:
        print(f"Classification composition validation failed: {error}", file=sys.stderr)
        sys.exit(1)
