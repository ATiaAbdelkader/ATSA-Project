import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer"


def command(socket, method, params, message_id):
    socket.send(json.dumps({"id": message_id, "method": method, "params": params}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            if "error" in response:
                raise RuntimeError(response["error"].get("message", "DevTools command failed"))
            return response.get("result", {})


def evaluate(socket, expression, message_id):
    return command(socket, "Runtime.evaluate", {"expression": expression, "returnByValue": True, "awaitPromise": True}, message_id).get("result", {}).get("value")


def wait_for(socket, expression, start_id, description):
    for message_id in range(start_id, start_id + 360):
        time.sleep(0.12)
        if evaluate(socket, expression, message_id):
            return message_id + 1
    raise RuntimeError(f"Timed out waiting for {description}.")


def has_session_reference(socket, message_id):
  return evaluate(socket, r"(() => { const value = document.querySelector('.analysis-session-reference')?.innerText || ''; return /^LOCAL-\d{8}T\d{6}Z-[A-Z0-9]{4}/.test(value) && value.includes('not a unique identifier, signature, authentication token, or biological result'); })()", message_id)


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=30, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    next_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Run analysis'))", 2, "run-analysis control")
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Run analysis')?.click()", next_id)
    next_id = wait_for(socket, "document.body.innerText.includes('Analysis complete — review required')", next_id + 1, "completed browser-local analysis")
    if not has_session_reference(socket, next_id):
        raise RuntimeError("Desktop completed analysis did not show the safeguarded browser-local session reference.")
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.includes('Reference field 01'))?.click()", next_id + 1)
    next_id = wait_for(socket, "!document.querySelector('.analysis-session-reference') && document.body.innerText.includes('Reference field 01')", next_id + 2, "stale session-reference reset after replacement footage")
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, next_id)
    if evaluate(socket, "Boolean(document.querySelector('.analysis-session-reference'))", next_id + 1):
        raise RuntimeError("Mobile layout retained a stale session reference after replacement footage was staged.")
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, next_id + 2)
    socket.close()
    print(json.dumps({"analysis_session_reference": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Analysis session reference validation failed: {error}", file=sys.stderr)
        sys.exit(1)
