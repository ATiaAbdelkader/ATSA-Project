import json
import sys
from urllib.request import urlopen

import websocket

from e2e_recording_countdown import APP_URL, DEVTOOLS_URL, command, evaluate, wait_for


def main():
    with urlopen(DEVTOOLS_URL, timeout=10) as response:
        target = next(item for item in json.load(response) if item.get("type") == "page")
    socket = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=20, suppress_origin=True)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", 1)
    message_id = wait_for(socket, "document.querySelector('.lab-sidebar')?.classList.contains('is-open') && document.querySelector('.workspace-content')?.innerText.includes('Clear, traceable semen')", 2, "desktop open sidebar and visible workspace")
    message_id = wait_for(socket, "document.querySelector('.lab-sidebar')?.getAttribute('aria-hidden') !== 'true' && !document.querySelector('.lab-sidebar')?.inert && document.querySelector('.nav-toggle')?.getAttribute('aria-expanded') === 'true'", message_id + 1, "desktop sidebar remains exposed")
    evaluate(socket, "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))", message_id)
    message_id = wait_for(socket, "document.querySelector('.lab-sidebar')?.classList.contains('is-open')", message_id + 1, "desktop Escape preserves sidebar")
    evaluate(socket, "const sidebarButtons = [...document.querySelectorAll('.lab-sidebar button')]; sidebarButtons.at(-1)?.focus(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))", message_id)
    message_id = wait_for(socket, "document.activeElement === [...document.querySelectorAll('.lab-sidebar button')].at(-1)", message_id + 1, "desktop Tab order remains unmanaged")
    evaluate(socket, "[...document.querySelectorAll('.lab-nav button')].find(button => button.innerText.includes('Method controls'))?.click()", message_id)
    message_id = wait_for(socket, "document.querySelector('.lab-sidebar')?.classList.contains('is-open') && document.querySelector('.crumb strong')?.innerText === 'Method controls'", message_id + 1, "desktop navigation selection retains sidebar")
    command(socket, "Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 1, "mobile": True}, message_id)
    evaluate(socket, f"location.href = {json.dumps(APP_URL)}", message_id + 1)
    message_id = wait_for(socket, "!document.querySelector('.lab-sidebar')?.classList.contains('is-open') && document.querySelector('.lab-sidebar')?.getAttribute('aria-hidden') === 'true' && document.querySelector('.lab-sidebar')?.inert && document.querySelector('.nav-toggle')?.getAttribute('aria-controls') === 'laboratory-navigation' && document.querySelector('.nav-toggle')?.getAttribute('aria-expanded') === 'false' && getComputedStyle(document.querySelector('.nav-toggle')).display !== 'none' && document.querySelector('.workspace-content')?.innerText.includes('Clear, traceable semen')", message_id + 2, "mobile closed sidebar is hidden and non-interactive")
    evaluate(socket, "document.querySelector('.nav-toggle')?.click()", message_id)
    message_id = wait_for(socket, "document.querySelector('.lab-sidebar')?.classList.contains('is-open') && document.querySelector('.lab-sidebar')?.getAttribute('aria-hidden') !== 'true' && !document.querySelector('.lab-sidebar')?.inert && document.querySelector('.nav-toggle')?.getAttribute('aria-expanded') === 'true' && document.activeElement?.getAttribute('aria-label') === 'Close navigation'", message_id + 1, "mobile opened navigation with exposed sidebar and close-control focus")
    evaluate(socket, "const sidebarButtons = [...document.querySelectorAll('.lab-sidebar button')]; sidebarButtons.at(-1)?.focus(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))", message_id)
    message_id = wait_for(socket, "document.activeElement?.getAttribute('aria-label') === 'Close navigation'", message_id + 1, "mobile Tab wraps from last sidebar control to close control")
    evaluate(socket, "document.querySelector('[aria-label=\"Close navigation\"]')?.focus(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))", message_id)
    message_id = wait_for(socket, "document.activeElement === [...document.querySelectorAll('.lab-sidebar button')].at(-1)", message_id + 1, "mobile Shift+Tab wraps from close control to last sidebar control")
    evaluate(socket, "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))", message_id)
    message_id = wait_for(socket, "!document.querySelector('.lab-sidebar')?.classList.contains('is-open') && document.querySelector('.lab-sidebar')?.getAttribute('aria-hidden') === 'true' && document.querySelector('.lab-sidebar')?.inert && document.querySelector('.nav-toggle')?.getAttribute('aria-expanded') === 'false' && document.activeElement?.classList.contains('nav-toggle') && document.querySelector('.workspace-content')?.innerText.includes('Clear, traceable semen')", message_id + 1, "mobile Escape hides navigation and restores toggle focus")
    evaluate(socket, "document.querySelector('.nav-toggle')?.click()", message_id)
    message_id = wait_for(socket, "document.querySelector('.lab-sidebar')?.classList.contains('is-open') && document.activeElement?.getAttribute('aria-label') === 'Close navigation'", message_id + 1, "mobile reopened navigation with close-control focus")
    evaluate(socket, "[...document.querySelectorAll('.lab-nav button')].find(button => button.innerText.includes('Method controls'))?.click()", message_id)
    message_id = wait_for(socket, "!document.querySelector('.lab-sidebar')?.classList.contains('is-open') && document.activeElement?.classList.contains('nav-toggle') && document.querySelector('.crumb strong')?.innerText === 'Method controls'", message_id + 1, "mobile destination selection dismisses navigation and restores toggle focus")
    command(socket, "Emulation.clearDeviceMetricsOverride", {}, message_id)
    socket.close()
    print(json.dumps({"responsive_navigation": "complete", "desktop": True, "mobile": True}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Responsive navigation validation failed: {error}", file=sys.stderr)
        sys.exit(1)
