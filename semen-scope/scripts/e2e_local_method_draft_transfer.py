import json
import sys
import time
from pathlib import Path
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer"
DOWNLOADS = Path("/home/ubuntu/Downloads")


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


def wait_for(socket, expression, start_message_id, description):
    for message_id in range(start_message_id, start_message_id + 100):
        time.sleep(0.12)
        if evaluate(socket, expression, message_id):
            return message_id + 1
    raise RuntimeError(f"Timed out waiting for {description}.")


def set_value(socket, expression, value, message_id):
    return evaluate(socket, f"""(() => {{ const input = {expression}; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, {json.dumps(value)}); input.dispatchEvent(new Event('input', {{ bubbles: true }})); input.dispatchEvent(new Event('change', {{ bubbles: true }})); return input.value; }})()""", message_id)


def validate_viewport(socket, message_id, check_download):
    message_id = wait_for(socket, "Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Export draft')) && Boolean([...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Import draft'))", message_id, "local draft transfer controls")
    input_expression = "[...document.querySelectorAll('.metadata-panel input[type=number]')][0]"
    set_value(socket, input_expression, "0.42", message_id)
    evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Save local draft')?.click()", message_id + 1)
    draft_text = evaluate(socket, "localStorage.getItem('semenscope.browser-local-method-draft.v1')", message_id + 2)
    if not isinstance(json.loads(draft_text), dict):
        raise RuntimeError("Could not create a valid local draft for transfer testing.")
    if check_download:
        for previous in DOWNLOADS.glob("semenscope-browser-local-method-draft-*.json"):
            previous.unlink()
        evaluate(socket, "[...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'Export draft')?.click()", message_id + 3)
        for _ in range(20):
            time.sleep(0.2)
            files = list(DOWNLOADS.glob("semenscope-browser-local-method-draft-*.json"))
            if files:
                break
        else:
            raise RuntimeError("Browser-local method draft export did not download.")
        exported = json.loads(files[0].read_text(encoding="utf-8"))
        if exported.get("calibration", {}).get("micronsPerPixel") != 0.42 or not exported.get("thresholds"):
            raise RuntimeError("Exported method draft omitted validated local settings.")
    set_value(socket, input_expression, "0.77", message_id + 4)
    import_result = evaluate(socket, f"""(async () => {{
      const input = document.querySelector('input[accept="application/json,.json"]');
      const transfer = new DataTransfer();
      transfer.items.add(new File([{json.dumps(draft_text)}], 'method-draft.json', {{ type: 'application/json' }}));
      Object.defineProperty(input, 'files', {{ value: transfer.files }});
      input.dispatchEvent(new Event('change', {{ bubbles: true }}));
      await new Promise(resolve => setTimeout(resolve, 120));
      return {input_expression}.value;
    }})()""", message_id + 5)
    if import_result != "0.42":
        raise RuntimeError("Validated browser-local method draft import did not restore active method settings.")
    safeguard = evaluate(socket, "document.body.innerText.includes('Import and restore clear board evidence and never change an immutable analysis record.')", message_id + 6)
    if not safeguard:
        raise RuntimeError("Method-draft import safeguard text was not visible.")
    return message_id + 7


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    message_id = validate_viewport(socket, 2, True)
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, message_id)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", message_id + 1)
    message_id = validate_viewport(socket, message_id + 2, False)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, message_id)
    socket.close()
    print(json.dumps({"local_method_draft_transfer": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Local method draft transfer validation failed: {error}", file=sys.stderr)
        sys.exit(1)
