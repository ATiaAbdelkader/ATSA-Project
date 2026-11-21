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
        if evaluate(socket, "(() => { const video = document.querySelector('video.analysis-video'); const button = [...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Mark current frame'); return Boolean(video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && button && !button.disabled); })()", message_id):
            break
    else:
        raise RuntimeError("Enabled local review bookmark control did not render after video decoding.")
    evaluate(socket, "(() => { const video = document.querySelector('video.analysis-video'); video.currentTime = 0.2; const input = document.querySelector('[aria-label=\"Optional local technical bookmark label\"]'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, 'check field edge'); input.dispatchEvent(new Event('input', { bubbles: true })); })()", start_id + 41)
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Mark current frame')?.click()", start_id + 42)
    for message_id in range(start_id + 43, start_id + 63):
        time.sleep(0.1)
        text = evaluate(socket, "document.querySelector('.review-bookmarks')?.innerText || ''", message_id)
        if "Frame 5" in text and "check field edge" in text and "optional labels remain only in this browser" in text:
            break
    else:
        raise RuntimeError("Labeled browser-local technical review bookmark did not render.")
    evaluate(socket, "(() => { window.__bookmarkCsv = ''; window.__bookmarkCsvDownload = ''; URL.createObjectURL = blob => { blob.text().then(text => window.__bookmarkCsv = text); return 'blob:local-bookmarks'; }; URL.revokeObjectURL = () => {}; HTMLAnchorElement.prototype.click = function() { window.__bookmarkCsvDownload = this.download; }; })()", start_id + 63)
    evaluate(socket, "[...document.querySelectorAll('.review-bookmark-actions button')].find(item => item.innerText.includes('Export bookmarks CSV'))?.click()", start_id + 64)
    for message_id in range(start_id + 65, start_id + 85):
        time.sleep(0.1)
        csv = evaluate(socket, "window.__bookmarkCsv", message_id)
        if csv and "bookmark_frame" in csv:
            break
    else:
        raise RuntimeError("Browser-local technical review bookmark CSV was not created.")
    exported = evaluate(socket, "window.__bookmarkCsv.includes('check field edge') && window.__bookmarkCsv.includes('Browser-local technical review bookmark only') && window.__bookmarkCsvDownload === 'reference-field-03-technical-review-bookmarks.csv'", start_id + 85)
    if not exported:
        raise RuntimeError("Browser-local bookmark CSV content or filename did not preserve technical-only local review context.")
    evaluate(socket, "(() => { const video = document.querySelector('video.analysis-video'); video.currentTime = 0.6; [...document.querySelectorAll('.review-bookmark-actions button')].find(item => item.innerText.includes('Frame 5'))?.click(); })()", start_id + 64)
    for message_id in range(start_id + 65, start_id + 85):
        time.sleep(0.1)
        time_value = evaluate(socket, "document.querySelector('video.analysis-video')?.currentTime", message_id)
        if time_value is not None and abs(time_value - 0.2) < 0.03:
            break
    else:
        raise RuntimeError("Local review bookmark did not restore its browser-local timestamp.")
    evaluate(socket, "[...document.querySelectorAll('.review-bookmark-actions button')].find(item => item.innerText.trim() === 'Clear bookmarks')?.click()", start_id + 86)
    cleared = evaluate(socket, "!document.querySelector('.review-bookmarks')", start_id + 87)
    if not cleared:
        raise RuntimeError("Local review bookmarks did not clear from the browser session.")
    return {"bookmark": "frame_5", "csv_exported": True, "seek_restored": True, "cleared": True}


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    desktop = verify(socket, 1)
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, 200)
    mobile = verify(socket, 300)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, 500)
    print(json.dumps({"review_bookmarks": "complete", "desktop": desktop, "mobile_375x812": mobile}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Review bookmark validation failed: {error}", file=sys.stderr)
        sys.exit(1)
