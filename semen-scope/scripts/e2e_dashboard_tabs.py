import json
import sys
import time
from urllib.request import urlopen

import websocket


DEVTOOLS_URL = "http://127.0.0.1:9222/json"
APP_URL = "https://3000-i1zkd2g8v1etu89ecml0k-26194f07.us2.manus.computer"


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
            if "error" in response:
                raise RuntimeError(response["error"].get("message", f"{method} failed"))
            return response.get("result")


def click_nav(socket, label, message_id):
    expression = f"""(() => {{
      const button = [...document.querySelectorAll('.lab-nav button')].find(item => item.innerText.includes({json.dumps(label)}));
      if (!button) return false;
      button.click();
      return true;
    }})()"""
    if not evaluate(socket, expression, message_id):
        raise RuntimeError(f"Could not click the {label} dashboard tab.")
    time.sleep(0.3)


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    for message_id in range(2, 25):
        time.sleep(0.25)
        if evaluate(socket, "document.body.innerText.includes('Analysis workspace')", message_id):
            break
    else:
        raise RuntimeError("SemenScope workspace did not load.")

    click_nav(socket, "Field review", 28)
    fields = evaluate(socket, "document.body.innerText.includes('Field review') && document.body.innerText.includes('No fields selected') && document.body.innerText.includes('Local session only') && Boolean(document.querySelector('.field-review-panel'))", 29)
    if not fields:
        raise RuntimeError("Field Review did not render its browser-local empty state.")

    click_nav(socket, "Technical audit", 29)
    audit = evaluate(socket, "document.body.innerText.includes('Technical audit') && document.body.innerText.includes('No local analysis to audit') && document.body.innerText.includes('Local review surface') && Boolean(document.querySelector('.technical-audit-view'))", 30)
    if not audit:
        raise RuntimeError("Technical Audit did not render its browser-local empty state.")

    click_nav(socket, "Sample history", 31)
    history = evaluate(socket, "document.body.innerText.includes('Sample history') && document.body.innerText.includes('Sign in to view laboratory records')", 32)
    if not history:
        raise RuntimeError("Sample History view did not render its persisted-record access state.")

    click_nav(socket, "Method controls", 33)
    method = evaluate(socket, "(() => { const text = document.body.innerText.toLowerCase(); return text.includes('method controls') && text.includes('calibration provenance') && text.includes('core analysis cut-offs') && text.includes('direction weight'); })()", 34)
    if not method:
        raise RuntimeError("Method Controls view did not render calibration and threshold controls.")

    click_nav(socket, "Quality review", 35)
    quality = evaluate(socket, "document.body.innerText.includes('Quality review') && document.body.innerText.includes('Sign in to review saved evidence')", 36)
    if not quality:
        raise RuntimeError("Quality Review view did not render its guarded saved-evidence state.")

    click_nav(socket, "Analysis workspace", 37)
    workspace = evaluate(socket, "document.body.innerText.includes('Clear, traceable semen') && document.querySelector('.lab-nav button.active')?.innerText.includes('Analysis workspace')", 38)
    if not workspace:
        raise RuntimeError("Analysis workspace did not restore after dashboard-tab navigation.")

    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, 39)
    time.sleep(0.4)
    mobile_nav_open = evaluate(socket, "(() => { const button = document.querySelector('.nav-toggle'); button?.click(); return document.documentElement.clientWidth <= 375 && document.querySelector('.lab-sidebar')?.classList.contains('is-open'); })()", 40)
    if not mobile_nav_open:
        raise RuntimeError("Mobile dashboard navigation did not open at the narrow viewport.")
    click_nav(socket, "Field review", 41)
    mobile_fields = evaluate(socket, "document.body.innerText.includes('Field review') && document.body.innerText.includes('No fields selected') && !document.querySelector('.lab-sidebar')?.classList.contains('is-open')", 42)
    if not mobile_fields:
        raise RuntimeError("Field Review did not render its browser-local mobile workflow.")
    evaluate(socket, "document.querySelector('.nav-toggle')?.click()", 43)
    click_nav(socket, "Technical audit", 44)
    mobile_audit = evaluate(socket, "document.body.innerText.includes('Technical audit') && document.body.innerText.includes('No local analysis to audit') && !document.querySelector('.lab-sidebar')?.classList.contains('is-open')", 45)
    if not mobile_audit:
        raise RuntimeError("Technical Audit did not render its browser-local mobile workflow.")
    evaluate(socket, "document.querySelector('.nav-toggle')?.click()", 46)
    click_nav(socket, "Method controls", 47)
    mobile_method = evaluate(socket, "Boolean(document.querySelector('.weight-control-grid')) && document.body.innerText.toLowerCase().includes('advanced reproducibility controls')", 48)
    if not mobile_method:
        raise RuntimeError("Method controls did not expose the advanced reproducibility workflow on mobile.")
    evaluate(socket, "document.querySelector('.nav-toggle')?.click()", 49)
    time.sleep(0.2)
    click_nav(socket, "Quality review", 50)
    mobile_quality = False
    for message_id in range(51, 61):
        time.sleep(0.25)
        mobile_quality = evaluate(socket, "document.body.innerText.includes('Quality review') && (Boolean(document.querySelector('.quality-summary-strip')) || Boolean(document.querySelector('.tab-loading-state')) || Boolean(document.querySelector('.tab-empty-state')))", message_id)
        if mobile_quality:
            break
    if not mobile_quality:
        raise RuntimeError("Quality review did not render its mobile workflow.")
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, 62)

    print(json.dumps({"dashboard_tabs": "complete", "fields": fields, "audit": audit, "history": history, "method": method, "quality": quality, "workspace": workspace, "mobile_navigation": mobile_nav_open, "mobile_fields": mobile_fields, "mobile_audit": mobile_audit, "mobile_method": mobile_method, "mobile_quality": mobile_quality}, indent=2))
    socket.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Dashboard tab validation failed: {error}", file=sys.stderr)
        sys.exit(1)
