import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9223/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer"


def get_target():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        targets = json.load(response)
    return next(target for target in targets if target.get("type") == "page")


def evaluate(socket, expression, message_id):
    socket.send(json.dumps({"id": message_id, "method": "Runtime.evaluate", "params": {"expression": expression, "returnByValue": True, "awaitPromise": True}}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            if "exceptionDetails" in response.get("result", {}):
                raise RuntimeError(response["result"]["exceptionDetails"].get("text", "Browser evaluation failed"))
            return response.get("result", {}).get("result", {}).get("value")


def send_command(socket, method, params, message_id):
    socket.send(json.dumps({"id": message_id, "method": method, "params": params}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            if "error" in response:
                raise RuntimeError(response["error"].get("message", "Browser command failed"))
            return response.get("result", {})


def main():
    time.sleep(1)
    target = get_target()
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    button_rect = None
    for _ in range(20):
        time.sleep(0.5)
        button_rect = evaluate(socket, "(() => { const button = [...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'); if (!button) return null; button.scrollIntoView({ block: 'center', inline: 'center' }); const rect = button.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })()", 2)
        if button_rect:
            break
    if not button_rect:
        raise RuntimeError("Could not find the Run analysis control.")
    send_command(socket, "Input.dispatchMouseEvent", {"type": "mousePressed", "x": button_rect["x"], "y": button_rect["y"], "button": "left", "clickCount": 1}, 3)
    send_command(socket, "Input.dispatchMouseEvent", {"type": "mouseReleased", "x": button_rect["x"], "y": button_rect["y"], "button": "left", "clickCount": 1}, 4)
    time.sleep(0.5)
    live_status = evaluate(socket, "document.body.innerText", 5)
    if "Processing frames" not in live_status and "Analysis complete — review required" not in live_status:
        invoked = evaluate(socket, "(() => { const button = [...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'); if (!button) return false; const key = Object.keys(button).find(item => item.startsWith('__reactProps$')); if (!key || typeof button[key]?.onClick !== 'function') return false; button[key].onClick(); return true; })()", 6)
        if not invoked:
            raise RuntimeError("The analysis control did not expose an invokable React click handler for validation.")
    deadline = time.time() + 35
    status = ""
    live_observation = None
    trajectory_selected = False
    inspector_visible = False
    message_id = 7
    while time.time() < deadline:
        time.sleep(0.1)
        status = evaluate(socket, "document.body.innerText", message_id)
        message_id += 1
        if "LIVE ANALYSIS" in status:
            live_observation = evaluate(socket, "(() => { const video = document.querySelector('.analysis-video'); return { time: video?.currentTime ?? 0, text: document.body.innerText.includes('Frame ') && document.body.innerText.includes('active tracks') }; })()", message_id)
            message_id += 1
            if not trajectory_selected:
                trajectory_selected = evaluate(socket, "(() => { const track = document.querySelector('.selectable-track'); if (!track) return false; track.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; })()", message_id)
                message_id += 1
        if trajectory_selected:
            inspector_visible = evaluate(socket, "document.body.innerText.includes('SELECTED TRAJECTORY') && document.body.innerText.includes('VCL') && document.body.innerText.includes('BCF')", message_id)
            message_id += 1
        if "Analysis complete — review required" in status or "Analysis could not complete" in status:
            break
    if "Analysis complete — review required" not in status:
        raise RuntimeError(f"Reference analysis did not finish successfully within the test window. Rendered status: {status[:1800]}")
    checks = {
        "tracked_cells": "Tracked cells" in status and "No computed tracks" not in status,
        "trajectory_map": "Linked motion paths" in status and "0 tracks" not in status,
        "quality_flags": "Scientific review required" in status,
        "download_summary": "Download summary" in status,
        "advanced_review": "Method manifest" in status and "Confidence" in status and "ALH max" in status,
        "capture_quality": "Capture " in status and "Brightness" in status and "contrast" in status and "focus" in status,
    }
    if not all(checks.values()):
        raise RuntimeError(f"Analysis completed but required outputs were not visible: {checks}")
    if not live_observation or live_observation.get("time", 0) <= 0 or not live_observation.get("text"):
        raise RuntimeError(f"The synchronized live overlay was not visible before completion: {live_observation}")
    if not trajectory_selected or not inspector_visible:
        raise RuntimeError(f"A live trajectory could not be selected and inspected: selected={trajectory_selected}, inspector={inspector_visible}")
    print(json.dumps({"analysis_status": "complete", "checks": checks, "live_observation": live_observation, "trajectory_inspector": inspector_visible}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"E2E validation failed: {error}", file=sys.stderr)
        sys.exit(1)
