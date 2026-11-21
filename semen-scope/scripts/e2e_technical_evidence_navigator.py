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
    for message_id in range(31, 290):
        time.sleep(0.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        if "Analysis complete — review required" in text:
            break
        if "Analysis could not complete" in text:
            raise RuntimeError("Analysis failed before technical-evidence navigation validation.")
    else:
        raise RuntimeError("Analysis did not complete within the timeout.")
    valid = evaluate(socket, "(() => { const nav = document.querySelector('.technical-evidence-navigator'); const labels = [...nav?.querySelectorAll('button') || []].map(button => button.innerText.trim()); const required = ['Association','Sampling','Integrity','Field context','Detector','Detector load','Candidate scores','Reproducibility']; const before = document.getElementById('analysis-candidate-score-evidence')?.getBoundingClientRect().top ?? 0; [...nav.querySelectorAll('button')].find(button => button.innerText.trim() === 'Candidate scores')?.click(); const after = document.getElementById('analysis-candidate-score-evidence')?.getBoundingClientRect().top ?? 0; return Boolean(nav) && required.every(label => labels.includes(label)) && document.activeElement?.id === 'analysis-candidate-score-evidence' && document.body.innerText.includes('Navigation only; it does not change analysis output') && after <= before; })()", 291)
    if not valid:
        raise RuntimeError("Technical-evidence navigator labels, technical-only notice, or candidate-score destination did not validate.")
    print(json.dumps({"technical_evidence_navigator": "complete", "destinations": 8}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Technical-evidence navigator validation failed: {error}", file=sys.stderr)
        sys.exit(1)
