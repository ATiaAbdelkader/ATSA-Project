import json
import sys
import time
from pathlib import Path
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer"
DOWNLOADS = Path("/home/ubuntu/Downloads")


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
    for message_id in range(2, 30):
        time.sleep(0.2)
        if evaluate(socket, "Boolean([...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis'))", message_id):
            break
    else:
        raise RuntimeError("Run analysis control did not render.")
    evaluate(socket, "[...document.querySelectorAll('button')].find(item => item.innerText.trim() === 'Run analysis')?.click()", 30)
    for message_id in range(31, 330):
        time.sleep(0.15)
        text = evaluate(socket, "document.body.innerText", message_id)
        if "Analysis complete — review required" in text:
            break
        if "Analysis could not complete" in text:
            raise RuntimeError("Analysis failed before detector-load timeline validation.")
    else:
        raise RuntimeError("Analysis did not complete within the timeout.")
    evidence_visible = evaluate(socket, "document.body.innerText.includes('DETECTOR LOAD TIMELINE') && document.body.innerText.includes('Sampled candidate counts') && document.body.innerText.includes('does not change candidates, trajectories, metrics, classifications') && Boolean(document.querySelector('.detector-load-chart polyline'))", 331)
    for previous in DOWNLOADS.glob("*-method-manifest.json"):
        previous.unlink()
    if not evaluate(socket, "(() => { const button = [...document.querySelectorAll('button')].find(item => item.innerText.includes('Method manifest')); button?.click(); return Boolean(button); })()", 332):
        raise RuntimeError("Method manifest action was unavailable.")
    for _ in range(20):
        time.sleep(0.25)
        files = list(DOWNLOADS.glob("*-method-manifest.json"))
        if files:
            break
    else:
        raise RuntimeError("Method manifest did not download.")
    manifest = json.loads(files[0].read_text(encoding="utf-8"))
    evidence = manifest.get("detectorLoadTimeline")
    footage_provenance = manifest.get("sample", {}).get("footageProvenance")
    required = {"points", "sampledFrames", "candidateLimitPerFrame", "peakCandidates", "peakFrame", "capBoundSamples", "rationale"}
    notice = manifest.get("detectorLoadTimelineNotice", "")
    if not evidence_visible or not isinstance(evidence, dict) or not required.issubset(evidence) or not evidence["points"] or "does not change candidates, trajectories, metrics, classifications" not in notice:
        raise RuntimeError("Detector-load timeline or its technical-only safeguard was missing from the review UI or method manifest.")
    if footage_provenance != {"source": "reference", "container": "MP4"}:
        raise RuntimeError("Method manifest was missing the read-only reference-footage provenance metadata.")
    print(json.dumps({"detector_load_timeline": "complete", "samples": evidence["sampledFrames"], "peak": evidence["peakCandidates"], "footage_provenance": footage_provenance, "manifest": files[0].name}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Detector-load timeline validation failed: {error}", file=sys.stderr)
        sys.exit(1)
