import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9223/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer"
REFERENCE_URL = "/manus-storage/reference-3-h264_2a900d9c.mp4"


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
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=25)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    for message_id in range(2, 35):
        time.sleep(0.3)
        if evaluate(socket, "Boolean(document.querySelector('input[type=file]'))", message_id):
            break
    else:
        raise RuntimeError("Upload input was not rendered.")

    rejected = evaluate(socket, "(() => { const input = document.querySelector('input[type=file]'); const transfer = new DataTransfer(); transfer.items.add(new File(['not-a-video'], 'legacy.mov', { type: 'video/quicktime' })); const key = Object.keys(input).find(item => item.startsWith('__reactProps$')); if (key && typeof input[key]?.onChange === 'function') { input[key].onChange({ target: { files: transfer.files, value: '' } }); return true; } input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); return true; })()", 35)
    if not rejected:
        raise RuntimeError("Could not trigger incompatible upload preflight.")
    time.sleep(0.5)
    invalid_state = evaluate(socket, "(() => ({ warning: document.body.innerText.includes('H.264 MP4 or WebM'), activeFootageRetained: document.body.innerText.includes('Reference field 03') }))()", 36)
    if not all(invalid_state.values()):
        raise RuntimeError(f"Incompatible upload was not safely rejected: {invalid_state}")

    valid_state = evaluate(socket, f"(async () => {{ const response = await fetch({json.dumps(REFERENCE_URL)}); const blob = await response.blob(); const input = document.querySelector('input[type=file]'); const transfer = new DataTransfer(); transfer.items.add(new File([blob], 'validated-h264.mp4', {{ type: 'video/mp4' }})); const key = Object.keys(input).find(item => item.startsWith('__reactProps$')); if (key && typeof input[key]?.onChange === 'function') input[key].onChange({{ target: {{ files: transfer.files, value: '' }} }}); else {{ input.files = transfer.files; input.dispatchEvent(new Event('change', {{ bubbles: true }})); }} for (let i = 0; i < 35; i += 1) {{ await new Promise(resolve => setTimeout(resolve, 250)); const text = document.body.innerText; if (text.includes('validated-h264.mp4') && /Frames\\s*25/.test(text)) return {{ accepted: true, staged: true }}; }} return {{ accepted: false, staged: false, status: document.body.innerText.slice(-800) }}; }})()", 37)
    if not all(valid_state.values()):
        raise RuntimeError(f"H.264 MP4 did not pass local preflight: {valid_state}")
    print(json.dumps({"unsupported_upload_rejected": invalid_state, "h264_upload_accepted": valid_state}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Upload preflight validation failed: {error}", file=sys.stderr)
        sys.exit(1)
