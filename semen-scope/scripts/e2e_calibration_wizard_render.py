import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9223/json"
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
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    for message_id in range(2, 30):
        time.sleep(0.3)
        if evaluate(socket, "document.body.innerText.includes('Open calibration wizard')", message_id):
            break
    else:
        raise RuntimeError("Calibration wizard launch control was not rendered.")
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.includes('Open calibration wizard'))?.click()", 30)
    time.sleep(0.3)
    checks = evaluate(socket, "(() => { const body = document.body.innerText; const capture = [...document.querySelectorAll('button')].find(item => item.innerText.includes('Capture board frame')); return { instructions: body.includes('Place a board at the sample plane') && body.includes('Enter its known interval and click two adjacent references'), cameraGuardrail: body.includes('Start the camera preview below before capturing a calibration board'), captureDisabled: Boolean(capture?.disabled), disclaimer: body.includes('manual reference measurement'), manualProvenance: body.includes('Manual scale only') && body.includes('No board evidence recorded') }; })()", 31)
    if not all(checks.values()):
        raise RuntimeError(f"Calibration wizard guardrails were not rendered as expected: {checks}")
    print(json.dumps({"calibration_wizard_render": "complete", "checks": checks}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Calibration wizard render validation failed: {error}", file=sys.stderr)
        sys.exit(1)
