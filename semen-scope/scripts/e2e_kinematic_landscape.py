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
    if not evaluate(socket, "(() => { const button = [...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'); button?.click(); return Boolean(button); })()", 30):
        raise RuntimeError("Could not begin local analysis.")
    for message_id in range(31, 280):
        time.sleep(0.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        if "Analysis complete — review required" in text:
            break
        if "Analysis could not complete" in text:
            raise RuntimeError("Analysis failed before landscape validation.")
    else:
        raise RuntimeError("Analysis did not complete within the timeout.")
    rendered = evaluate(socket, "document.querySelectorAll('.landscape-point').length > 0 && document.body.innerText.includes('Current-run technical distribution only')", 281)
    if not rendered:
        raise RuntimeError("Kinematic landscape did not render the expected non-predictive track distribution.")
    invoked = evaluate(socket, "(() => { const point = document.querySelector('.landscape-point'); if (!point) return false; point.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; })()", 282)
    time.sleep(0.25)
    selected = evaluate(socket, "document.querySelectorAll('.landscape-point.selected').length === 1", 283)
    inspector = evaluate(socket, "document.body.innerText.includes('SELECTED TRAJECTORY') && document.body.innerText.includes('VCL') && document.body.innerText.includes('LIN')", 284)
    if not invoked or not selected or not inspector:
        raise RuntimeError(f"Landscape selection did not reach trajectory review: invoked={invoked}, selected={selected}, inspector={inspector}")
    print(json.dumps({"kinematic_landscape": "complete", "points_rendered": True, "track_selected": selected, "trajectory_inspector": inspector}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Kinematic landscape validation failed: {error}", file=sys.stderr)
        sys.exit(1)
