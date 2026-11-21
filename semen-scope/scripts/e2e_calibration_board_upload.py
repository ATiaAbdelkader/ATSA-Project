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
    upload_ready = evaluate(socket, "(() => { const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes('Upload board image')); return Boolean(button && !button.disabled); })()", 31)
    if not upload_ready:
        raise RuntimeError("Board-image upload control remained unavailable without a camera.")
    staged = evaluate(socket, "(() => { const input = [...document.querySelectorAll('input[type=file]')].find(item => item.accept.includes('image')); const svg = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"640\" height=\"480\"><rect width=\"640\" height=\"480\" fill=\"#e4ebe6\"/><g stroke=\"#21483f\" stroke-width=\"2\">' + Array.from({length: 15}, (_, i) => '<path d=\"M ' + (20 + i * 40) + ' 0 V 480\"/>').join('') + Array.from({length: 11}, (_, i) => '<path d=\"M 0 ' + (20 + i * 40) + ' H 640\"/>').join('') + '</g></svg>'; const transfer = new DataTransfer(); transfer.items.add(new File([svg], 'stage-board.svg', { type: 'image/svg+xml' })); const key = Object.keys(input).find(item => item.startsWith('__reactProps$')); if (key && typeof input[key]?.onChange === 'function') input[key].onChange({ target: { files: transfer.files, value: '' } }); else { input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); } return true; })()", 32)
    if not staged:
        raise RuntimeError("Could not stage the calibration board image.")
    for message_id in range(33, 55):
        time.sleep(0.2)
        if evaluate(socket, "Boolean(document.querySelector('.board-image-stage'))", message_id):
            break
    else:
        raise RuntimeError("Uploaded calibration board did not render in the wizard.")
    selected = evaluate(socket, "(() => { const stage = document.querySelector('.board-image-stage'); const box = stage.getBoundingClientRect(); stage.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: box.left + box.width * .25, clientY: box.top + box.height * .5 })); stage.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: box.left + box.width * .75, clientY: box.top + box.height * .5 })); return true; })()", 55)
    if not selected:
        raise RuntimeError("Could not select two uploaded-board references.")
    time.sleep(0.35)
    apply_ready = evaluate(socket, "(() => { const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes('Apply board scale')); return Boolean(button && !button.disabled); })()", 56)
    if not apply_ready:
        raise RuntimeError("Uploaded board did not yield an applicable two-point scale estimate.")
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.includes('Apply board scale'))?.click()", 57)
    time.sleep(0.35)
    result = evaluate(socket, "(() => { const text = document.body.innerText; return { boardReferenced: text.includes('Board-referenced scale'), manualWarningCleared: !text.includes('Manual scale only') }; })()", 58)
    if not all(result.values()):
        raise RuntimeError(f"Uploaded board scale did not replace manual provenance: {result}")
    print(json.dumps({"calibration_board_upload": "complete", "result": result}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Calibration board upload validation failed: {error}", file=sys.stderr)
        sys.exit(1)
