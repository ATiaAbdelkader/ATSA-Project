import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iwvd519yvkeifos54o1zl-ceb6452e.us2.manus.computer"


def evaluate(socket, expression, message_id):
    socket.send(json.dumps({"id": message_id, "method": "Runtime.evaluate", "params": {"expression": expression, "returnByValue": True, "awaitPromise": True}}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            if "exceptionDetails" in response.get("result", {}):
                raise RuntimeError(response["result"]["exceptionDetails"].get("text", "Browser evaluation failed"))
            return response.get("result", {}).get("result", {}).get("value")


def command(socket, method, params, message_id):
    socket.send(json.dumps({"id": message_id, "method": method, "params": params}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            return response.get("result", {})


def verify(socket, start_id):
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", start_id)
    for message_id in range(start_id + 1, start_id + 40):
        time.sleep(0.2)
        if evaluate(socket, "(() => { const video = document.querySelector('video.analysis-video'); const start = [...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Set window start'); const end = [...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Set window end'); return Boolean(video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && start && end && !start.disabled && end.disabled); })()", message_id):
            break
    else:
        raise RuntimeError("Browser-local technical review-window controls did not render in the expected initial state.")
    evaluate(socket, "document.querySelector('video.analysis-video').currentTime = 0.2", start_id + 41)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Set window start')?.click()", start_id + 42)
    start_marked = evaluate(socket, "document.querySelector('[aria-label=\"Browser-local technical review window\"]')?.innerText.includes('Start frame 5 · 0.200 s') && [...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Set window end')?.disabled === false", start_id + 43)
    evaluate(socket, "document.querySelector('video.analysis-video').currentTime = 0.6", start_id + 44)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Set window end')?.click()", start_id + 45)
    completed = evaluate(socket, "document.querySelector('[aria-label=\"Browser-local technical review window\"]')?.innerText.includes('frame 5 · 0.200 s to frame 15 · 0.600 s') && document.querySelector('[aria-label=\"Browser-local technical review window\"]')?.innerText.includes('does not change video, calibration, or analysis output')", start_id + 46)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Loop review window')?.click()", start_id + 47)
    evaluate(socket, "(() => { const video = document.querySelector('video.analysis-video'); video.currentTime = 0.6; video.dispatchEvent(new Event('timeupdate')); })()", start_id + 48)
    looped = evaluate(socket, "document.querySelector('video.analysis-video')?.currentTime === 0.2 && [...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Loop review window')?.getAttribute('aria-pressed') === 'true'", start_id + 49)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Loop review window')?.click()", start_id + 50)
    loop_stopped = evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Loop review window')?.getAttribute('aria-pressed') === 'false'", start_id + 51)
    evaluate(socket, "document.querySelector('video.analysis-video').currentTime = 0.8; [...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Go to window start')?.click()", start_id + 52)
    start_seek = evaluate(socket, "document.querySelector('video.analysis-video')?.currentTime === 0.2 && document.querySelector('[aria-label=\"Browser-local technical review timestamp in seconds\"]')?.value === '0.200'", start_id + 53)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Go to window end')?.click()", start_id + 54)
    end_seek = evaluate(socket, "document.querySelector('video.analysis-video')?.currentTime === 0.6 && document.querySelector('[aria-label=\"Browser-local technical review timestamp in seconds\"]')?.value === '0.600'", start_id + 55)
    evaluate(socket, "(() => { window.__reviewWindowCsv = ''; window.__reviewWindowDownload = ''; URL.createObjectURL = blob => { blob.text().then(text => window.__reviewWindowCsv = text); return 'blob:local-review-window'; }; URL.revokeObjectURL = () => {}; HTMLAnchorElement.prototype.click = function() { window.__reviewWindowDownload = this.download; }; })()", start_id + 56)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.includes('Export window CSV'))?.click()", start_id + 57)
    for message_id in range(start_id + 58, start_id + 78):
        time.sleep(0.1)
        csv = evaluate(socket, "window.__reviewWindowCsv", message_id)
        if csv and "start_frame" in csv:
            break
    else:
        raise RuntimeError("Browser-local technical review-window CSV was not created.")
    exported = evaluate(socket, "window.__reviewWindowCsv.includes('\\\"5\\\",\\\"0.200\\\",\\\"15\\\",\\\"0.600\\\",\\\"25\\\"') && window.__reviewWindowCsv.includes('Browser-local technical review window only') && window.__reviewWindowDownload === 'reference-field-03-technical-review-window.csv'", start_id + 78)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Clear window')?.click()", start_id + 79)
    cleared = evaluate(socket, "!document.querySelector('[aria-label=\"Browser-local technical review window\"]')", start_id + 80)
    if not start_marked or not completed or not looped or not loop_stopped or not start_seek or not end_seek or not exported or not cleared:
        raise RuntimeError(f"Browser-local technical review-window behavior did not complete: start_marked={start_marked}, completed={completed}, looped={looped}, loop_stopped={loop_stopped}, start_seek={start_seek}, end_seek={end_seek}, exported={exported}, cleared={cleared}")
    return {"start_frame": 5, "end_frame": 15, "looped": True, "boundary_navigation": True, "csv_exported": True, "cleared": True}


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    desktop = verify(socket, 1)
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, 200)
    mobile = verify(socket, 300)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, 500)
    socket.close()
    print(json.dumps({"review_window": "complete", "desktop": desktop, "mobile_375x812": mobile}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Technical review window validation failed: {error}", file=sys.stderr)
        sys.exit(1)
