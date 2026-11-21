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
            raise RuntimeError("Analysis failed before trajectory-audit validation.")
    else:
        raise RuntimeError("Analysis did not complete within the timeout.")
    selected = evaluate(socket, "(() => { const point = document.querySelector('.landscape-point'); point?.dispatchEvent(new MouseEvent('click', { bubbles: true })); return Boolean(point); })()", 281)
    time.sleep(0.2)
    audit_visible = evaluate(socket, "document.body.innerText.includes('POINT-LEVEL AUDIT') && document.querySelector('.trajectory-audit input[type=range]') !== null", 282)
    seek_action = evaluate(socket, "(() => { const button = [...document.querySelectorAll('.trajectory-audit button')].find(item => item.innerText.includes('Seek active video')); button?.click(); return Boolean(button); })()", 283)
    time.sleep(0.2)
    playback = evaluate(socket, "document.querySelector('video.analysis-video')?.currentTime ?? -1", 284)
    if not selected or not audit_visible or not seek_action or playback <= 0:
        raise RuntimeError(f"Trajectory audit validation failed: selected={selected}, audit={audit_visible}, seek={seek_action}, playback={playback}")
    print(json.dumps({"trajectory_audit": "complete", "audit_visible": audit_visible, "seek_action": seek_action, "playback_time": playback}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Trajectory audit validation failed: {error}", file=sys.stderr)
        sys.exit(1)
