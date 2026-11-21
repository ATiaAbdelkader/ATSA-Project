import json
import sys
import time
from pathlib import Path
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer/?view=history"
DOWNLOADS = Path("/home/ubuntu/Downloads")


def evaluate(socket, expression, message_id):
    socket.send(json.dumps({"id": message_id, "method": "Runtime.evaluate", "params": {"expression": expression, "returnByValue": True, "awaitPromise": True}}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            if "exceptionDetails" in response.get("result", {}):
                raise RuntimeError(response["result"]["exceptionDetails"].get("text", "Browser evaluation failed"))
            return response.get("result", {}).get("result", {}).get("value")


def click_button(socket, text, message_id):
    expression = f"""(() => {{
      const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes({json.dumps(text)}));
      if (!button) return false;
      button.click();
      return true;
    }})()"""
    if not evaluate(socket, expression, message_id):
        raise RuntimeError(f"Could not find the {text} action.")


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    for message_id in range(2, 62):
        time.sleep(0.25)
        if evaluate(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.includes('Copy handoff'))) && Boolean([...document.querySelectorAll('button')].find(item => item.innerText.includes('Export handoff CSV')))", message_id):
            break
    else:
        if evaluate(socket, "document.body.innerText.includes('Sign in to view laboratory records') || document.body.innerText.includes('No saved analyses yet')", 62):
            print(json.dumps({"lab_handoff": "skipped", "reason": "No authenticated saved record is available in the automation browser session."}, indent=2))
            socket.close()
            return
        raise RuntimeError("Laboratory handoff actions did not render for a saved record.")

    click_button(socket, "Copy handoff", 29)
    for message_id in range(30, 38):
        time.sleep(0.2)
        copied = evaluate(socket, "document.body.innerText.includes('Laboratory handoff summary copied')", message_id)
        if copied:
            break
    else:
        raise RuntimeError("Copy handoff did not report a successful reviewer-transfer action.")

    before = {path.name for path in DOWNLOADS.glob("*-laboratory-handoff.csv")}
    click_button(socket, "Export handoff CSV", 38)
    for _ in range(12):
        time.sleep(0.25)
        after = {path.name for path in DOWNLOADS.glob("*-laboratory-handoff.csv")}
        if after - before:
            break
    else:
        raise RuntimeError("Laboratory handoff CSV was not downloaded.")
    print(json.dumps({"lab_handoff": "complete", "copied": copied, "downloaded": sorted(after - before)}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Laboratory handoff validation failed: {error}", file=sys.stderr)
        sys.exit(1)
