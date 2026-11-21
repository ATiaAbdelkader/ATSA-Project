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
    for message_id in range(31, 280):
        time.sleep(0.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        if "Analysis complete — review required" in text:
            break
        if "Analysis could not complete" in text:
            raise RuntimeError("Analysis failed before output-fingerprint validation.")
    else:
        raise RuntimeError("Analysis did not complete within the timeout.")
    evidence_visible = evaluate(socket, "document.body.innerText.includes('OUTPUT FINGERPRINT') && document.body.innerText.includes('Browser-local reproducibility reference') && document.body.innerText.includes('not a cryptographic signature')", 281)
    fingerprint = evaluate(socket, "document.querySelector('.output-fingerprint code')?.textContent?.trim()", 282)
    for previous in DOWNLOADS.glob("*-method-manifest.json"):
        previous.unlink()
    if not evaluate(socket, "(() => { const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes('Method manifest')); button?.click(); return Boolean(button); })()", 283):
        raise RuntimeError("Method manifest action was unavailable.")
    for _ in range(20):
        time.sleep(0.25)
        files = list(DOWNLOADS.glob("*-method-manifest.json"))
        if files:
            break
    else:
        raise RuntimeError("Method manifest did not download.")
    manifest = json.loads(files[0].read_text(encoding="utf-8"))
    notice = manifest.get("outputFingerprintNotice", "")
    if not evidence_visible or not isinstance(fingerprint, str) or not fingerprint.startswith("SSO-") or manifest.get("outputFingerprint") != fingerprint or "not a cryptographic signature" not in notice:
        raise RuntimeError("Output fingerprint or its reproducibility-only safeguard was missing from the review UI or method manifest.")
    print(json.dumps({"output_fingerprint": "complete", "fingerprint": fingerprint, "manifest": files[0].name}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Output fingerprint validation failed: {error}", file=sys.stderr)
        sys.exit(1)
