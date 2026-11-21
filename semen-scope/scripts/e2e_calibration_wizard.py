import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9223/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer"


def target():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        return next(item for item in json.load(response) if item.get("type") == "page")


def evaluate(socket, expression, message_id):
    socket.send(json.dumps({"id": message_id, "method": "Runtime.evaluate", "params": {"expression": expression, "returnByValue": True, "awaitPromise": True}}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            if "exceptionDetails" in response.get("result", {}):
                raise RuntimeError(response["result"]["exceptionDetails"].get("text", "Browser evaluation failed"))
            return response.get("result", {}).get("result", {}).get("value")


def main():
    socket = websocket.create_connection(target()["webSocketDebuggerUrl"], timeout=20)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    for message_id in range(2, 30):
        time.sleep(0.35)
        ready = evaluate(socket, "document.body.innerText.includes('Open calibration wizard')", message_id)
        if ready:
            break
    else:
        raise RuntimeError("Calibration wizard launch control was not rendered.")

    evaluate(socket, "(() => { const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480; const context = canvas.getContext('2d'); context.fillStyle = '#d9ddd9'; context.fillRect(0, 0, canvas.width, canvas.height); context.strokeStyle = '#263c36'; context.lineWidth = 2; for (let x = 40; x < 640; x += 40) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 480); context.stroke(); } for (let y = 40; y < 480; y += 40) { context.beginPath(); context.moveTo(0, y); context.lineTo(640, y); context.stroke(); } window.__semenscopeCalibrationTestCanvas = canvas; Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => canvas.captureStream(15) }); return true; })()", 30)
    evaluate(socket, "(() => { const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes('Start preview')); if (!button) return false; const key = Object.keys(button).find(item => item.startsWith('__reactProps$')); if (key && typeof button[key]?.onClick === 'function') return button[key].onClick(); button.click(); return true; })()", 31)
    for message_id in range(32, 55):
        time.sleep(0.35)
        if evaluate(socket, "document.body.innerText.includes('Stop')", message_id):
            break
    else:
        raise RuntimeError(f"The local test microscope preview did not activate. Workspace status: {evaluate(socket, 'document.body.innerText', 55)[-1200:]}")

    evaluate(socket, "(() => { const video = document.querySelector('.camera-preview video'); if (!video) return false; Object.defineProperty(video, 'videoWidth', { configurable: true, get: () => 640 }); Object.defineProperty(video, 'videoHeight', { configurable: true, get: () => 480 }); const draw = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function(source, ...args) { if (source === video) { this.fillStyle = '#d9ddd9'; this.fillRect(0, 0, 640, 480); this.strokeStyle = '#263c36'; this.lineWidth = 2; for (let x = 40; x < 640; x += 40) { this.beginPath(); this.moveTo(x, 0); this.lineTo(x, 480); this.stroke(); } for (let y = 40; y < 480; y += 40) { this.beginPath(); this.moveTo(0, y); this.lineTo(640, y); this.stroke(); } return; } return draw.call(this, source, ...args); }; return true; })()", 55)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.includes('Open calibration wizard'))?.click()", 56)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.includes('Capture board frame'))?.click()", 57)
    for message_id in range(58, 82):
        time.sleep(0.2)
        stage = evaluate(socket, "document.querySelector('.board-image-stage') ? true : false", message_id)
        if stage:
            break
    else:
        raise RuntimeError("The calibration-board capture stage was not rendered.")

    point_result = evaluate(socket, "(() => { const stage = document.querySelector('.board-image-stage'); if (!stage) return false; const box = stage.getBoundingClientRect(); stage.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: box.left + box.width * .25, clientY: box.top + box.height * .5 })); stage.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: box.left + box.width * .75, clientY: box.top + box.height * .5 })); return true; })()", 82)
    if not point_result:
        raise RuntimeError("Could not select calibration-board references.")
    time.sleep(0.4)
    can_apply = evaluate(socket, "(() => { const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes('Apply board scale')); return Boolean(button && !button.disabled && document.body.innerText.includes('µm/px')); })()", 83)
    if not can_apply:
        raise RuntimeError("The two-point board scale estimate was not available.")
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.includes('Apply board scale'))?.click()", 84)
    time.sleep(0.35)
    applied = evaluate(socket, "document.body.innerText.includes('Board scale') && document.body.innerText.includes('µm/px')", 85)
    if not applied:
        raise RuntimeError("The calculated board scale was not applied to the method controls.")
    print(json.dumps({"calibration_wizard": "complete", "two_point_estimate": True, "scale_applied": applied}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Calibration wizard validation failed: {error}", file=sys.stderr)
        sys.exit(1)
