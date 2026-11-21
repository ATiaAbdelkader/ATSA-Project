import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer"


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
            raise RuntimeError("Analysis failed before review-queue validation.")
    else:
        raise RuntimeError("Analysis did not complete within the timeout.")
    rendered = evaluate(socket, "document.body.innerText.includes('TECHNICAL REVIEW QUEUE') && document.body.innerText.includes('does not reject tracks')", 281)
    item_count = evaluate(socket, "document.querySelectorAll('.technical-review-list button').length", 282)
    if not rendered or not item_count:
        raise RuntimeError(f"Technical review queue did not provide a selectable current-run candidate: rendered={rendered}, count={item_count}")
    selected = evaluate(socket, "(() => { const item = document.querySelector('.technical-review-list button'); item?.click(); return Boolean(item); })()", 283)
    time.sleep(0.2)
    inspector = evaluate(socket, "document.body.innerText.includes('SELECTED TRAJECTORY') && document.body.innerText.includes('Confidence')", 284)
    if not selected or not inspector:
        raise RuntimeError(f"Technical review queue did not open trajectory inspection: selected={selected}, inspector={inspector}")
    print(json.dumps({"technical_review_queue": "complete", "review_candidates": item_count, "trajectory_inspector": inspector}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Technical review queue validation failed: {error}", file=sys.stderr)
        sys.exit(1)
