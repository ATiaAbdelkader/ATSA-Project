import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9224/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer"
REFERENCE_URL = "/manus-storage/reference-3-h264_2a900d9c.mp4"
CAMERA_FIXTURE_URL = "/manus-storage/microscope-capture-fixture_7b105d23.webm"


def evaluate(socket, expression, message_id):
    socket.send(json.dumps({"id": message_id, "method": "Runtime.evaluate", "params": {"expression": expression, "returnByValue": True, "awaitPromise": True}}))
    while True:
        response = json.loads(socket.recv())
        if response.get("id") == message_id:
            if "exceptionDetails" in response.get("result", {}):
                raise RuntimeError(response["result"]["exceptionDetails"].get("text", "Browser evaluation failed"))
            return response.get("result", {}).get("result", {}).get("value")


def main():
    time.sleep(1)
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    time.sleep(3)
    result = evaluate(socket, f"""(async () => {{
      const loadMetadata = source => new Promise(resolve => {{
        const video = document.createElement('video');
        let finished = false;
        const done = value => {{ if (!finished) {{ finished = true; resolve(value); }} }};
        const timeout = window.setTimeout(() => done({{ ok: false, reason: 'timeout' }}), 12000);
        video.preload = 'metadata';
        video.muted = true;
        video.addEventListener('loadedmetadata', () => {{ window.clearTimeout(timeout); done({{ ok: true, width: video.videoWidth, height: video.videoHeight, duration: video.duration }}); }}, {{ once: true }});
        video.addEventListener('error', () => {{ window.clearTimeout(timeout); done({{ ok: false, reason: 'media-error', code: video.error?.code }}); }}, {{ once: true }});
        video.src = source;
        video.load();
      }});
      const reference = await loadMetadata({json.dumps(REFERENCE_URL)});
      const uploadResponse = await fetch({json.dumps(REFERENCE_URL)});
      const uploadBlob = new Blob([await uploadResponse.arrayBuffer()], {{ type: 'video/mp4' }});
      const uploadUrl = URL.createObjectURL(uploadBlob);
      const upload = await loadMetadata(uploadUrl);
      URL.revokeObjectURL(uploadUrl);
      const cameraResponse = await fetch({json.dumps(CAMERA_FIXTURE_URL)});
      const cameraBlob = new Blob([await cameraResponse.arrayBuffer()], {{ type: 'video/webm' }});
      const cameraUrl = URL.createObjectURL(cameraBlob);
      const camera = await loadMetadata(cameraUrl);
      URL.revokeObjectURL(cameraUrl);
      const {{ analyzeMicroscopeVideo }} = await import('/src/lib/analysisProcessor.ts');
      const progress = [];
      const analysis = await analyzeMicroscopeVideo({{
        sourceUrl: {json.dumps(REFERENCE_URL)},
        calibration: {{ micronsPerPixel: 0.5, frameRate: 25 }},
        thresholds: {{ motilityVclMin: 10, progressiveStrMin: 70, progressiveVapMin: 25, maxLinkDistancePx: 18, detectionSensitivity: 30, minTrackFrames: 6 }},
        onProgress: update => progress.push(update),
      }});
      return {{ reference, upload, camera, analysis: {{ tracks: analysis.tracks.length, totalTrackedCells: analysis.summary.totalTrackedCells }}, progress: {{ count: progress.length, first: progress[0], last: progress.at(-1), ordered: progress.every((item, index) => index === 0 || item.playbackTime >= progress[index - 1].playbackTime) }} }};
    }})()""", 2)
    socket.close()
    media_sources = [result.get("reference"), result.get("upload"), result.get("camera")] if result else []
    if not result or not all(item and item.get("ok") for item in media_sources):
        raise RuntimeError(f"Metadata did not load across all intake sources: {result}")
    if any(item.get("width") != 780 or item.get("height") != 580 for item in media_sources):
        raise RuntimeError(f"Unexpected metadata dimensions: {result}")
    if result.get("analysis", {}).get("totalTrackedCells") is None:
        raise RuntimeError(f"Analysis did not return a track summary: {result}")
    progress = result.get("progress", {})
    if progress.get("count", 0) < 3 or not progress.get("ordered") or progress.get("last", {}).get("progress") != 100:
        raise RuntimeError(f"Analysis did not provide ordered synchronized progress: {result}")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Metadata validation failed: {error}", file=sys.stderr)
        sys.exit(1)
