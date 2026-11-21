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
    for message_id in range(2, 24):
        time.sleep(0.25)
        if evaluate(socket, "document.body.innerText.includes('Traceability & planning')", message_id):
            break
    else:
        raise RuntimeError("Specimen workflow panel did not render.")

    result = evaluate(socket, """(() => {
      const setValue = (selector, value) => {
        const field = document.querySelector(selector);
        if (!field) throw new Error(`Missing ${selector}`);
        const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, 'value').set.call(field, value);
        field.dispatchEvent(new Event('input', { bubbles: true }));
      };
      setValue('input[placeholder="e.g., EJ-024"]', 'EJ-42');
      setValue('input[placeholder="e.g., BULL-12"]', 'BULL-9');
      setValue('input[placeholder="Do not infer"]', '80');
      setValue('input[placeholder="e.g., 4"]', '4');
      setValue('input[placeholder="e.g., 20"]', '20');
      return true;
    })()""", 24)
    if not result:
        raise RuntimeError("Could not populate specimen workflow inputs.")
    time.sleep(0.35)
    state = evaluate(socket, "(() => { const text = document.body.innerText; return { dose: text.includes('16 theoretical doses'), specimen: text.includes('2 ready'), disclaimer: text.includes('does not measure concentration') }; })()", 25)
    if not all(state.values()):
        raise RuntimeError(f"Specimen workflow did not calculate or communicate safeguards correctly: {state}")
    print(json.dumps({"specimen_workflow": "complete", "result": state}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Specimen workflow validation failed: {error}", file=sys.stderr)
        sys.exit(1)
