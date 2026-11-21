import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-iv6v21kfa4yzi74zmflr2-82d2138c.us4.manus.computer"


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


MARKUP = """
(() => {
  document.querySelector('#snapshot-evidence-layout-fixture')?.remove();
  const fixture = document.createElement('div');
  fixture.id = 'snapshot-evidence-layout-fixture';
  fixture.className = 'snapshot-detail-body';
  fixture.style.cssText = 'width: min(820px, calc(100vw - 24px)); margin: 12px auto; background: #fff;';
  fixture.innerHTML = `<section class="snapshot-technical-evidence" aria-label="Persisted technical evidence"><div class="snapshot-evidence-heading"><div><p class="eyebrow">PERSISTED TECHNICAL EVIDENCE</p><h3>Immutable review archive</h3></div><small>Read-only technical provenance.</small></div><div class="snapshot-evidence-grid"><article><strong>Temporal sampling</strong><span>25/100 frames · every 4 frames</span><small>Sampling provenance only.</small></article><article><strong>Linkage continuity</strong><span>90.0% nominal links</span><small>Association provenance only.</small></article><article><strong>Spatial coverage</strong><span>4/9 image regions</span><small>Not a density estimate.</small></article><article><strong>Boundary contact</strong><span>20.0% outer boundary points</span><small>No trajectory is rejected.</small></article></div></section>`;
  document.body.append(fixture);
  return true;
})()
"""


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    time.sleep(1.5)
    evaluate(socket, MARKUP, 2)
    desktop = evaluate(socket, "(() => { const archive = document.querySelector('.snapshot-technical-evidence'); const grid = document.querySelector('.snapshot-evidence-grid'); const cards = [...document.querySelectorAll('.snapshot-evidence-grid > article')]; const style = grid && getComputedStyle(grid); return Boolean(archive && grid && style) && archive.querySelector('section') === null && cards.length === 4 && style.gridTemplateColumns.split(' ').length === 2; })()", 3)
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, 4)
    mobile = evaluate(socket, "(() => { const archive = document.querySelector('.snapshot-technical-evidence'); const grid = document.querySelector('.snapshot-evidence-grid'); const cards = [...document.querySelectorAll('.snapshot-evidence-grid > article')]; const style = grid && getComputedStyle(grid); return Boolean(archive && grid && style) && archive.getBoundingClientRect().width <= 351 && cards.length === 4 && style.gridTemplateColumns.split(' ').length === 1; })()", 5)
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, 6)
    evaluate(socket, "document.querySelector('#snapshot-evidence-layout-fixture')?.remove()", 7)
    if not desktop or not mobile:
        raise RuntimeError("Saved technical-evidence archive layout was not readable at desktop or mobile width.")
    print(json.dumps({"snapshot_technical_evidence_layout": "complete", "desktop": desktop, "mobile": mobile}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Saved technical-evidence layout validation failed: {error}", file=sys.stderr)
        sys.exit(1)
