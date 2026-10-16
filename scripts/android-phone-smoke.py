"""Exercise the installed WebView app and real Android IME, without network."""
import re
import subprocess
import time
import xml.etree.ElementTree as ET
import uiautomator2 as u2
from pathlib import Path

out = Path('test-results/android-install')
phase = 'open-document'
device = u2.connect()
device.jsonrpc.setConfigurator({'waitForIdleTimeout': 0, 'waitForSelectorTimeout': 0})

def adb(*args):
    return subprocess.run(['adb', *args], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30).stdout

def snapshot():
    # Capture the current accessibility hierarchy directly. The shell dumper
    # can time out waiting for idle yet leave its previous XML file in place.
    raw = device.dump_hierarchy(compressed=False).encode('utf-8')
    (out / 'phone-ui.xml').write_bytes(raw)
    return ET.fromstring(raw)

def rect(node):
    return tuple(map(int, re.findall(r'-?\d+', node.get('bounds', ''))))

def find(text, attempts=20):
    for _ in range(attempts):
        root = snapshot()
        for node in root.iter('node'):
            if text.casefold() in ((node.get('text') or '').strip().casefold(), (node.get('content-desc') or '').strip().casefold()):
                bounds = rect(node)
                if len(bounds) == 4 and bounds[2] > bounds[0] and bounds[3] > bounds[1]:
                    return node
        time.sleep(1)
    labels = [node.get('text') or node.get('content-desc') for node in root.iter('node') if node.get('text') or node.get('content-desc')]
    raise AssertionError('Visible Android control not found: ' + text + '; labels: ' + ' | '.join(labels)[:1600])

def tap(text):
    size = list(map(int, re.findall(r'\d+', adb('shell', 'wm', 'size').decode().splitlines()[0])))
    width, height = size[-2:]
    for _ in range(18):
        root = snapshot()
        nodes = [n for n in root.iter('node') if text.casefold() in ((n.get('text') or '').strip().casefold(), (n.get('content-desc') or '').strip().casefold()) and len(rect(n)) == 4]
        nodes.sort(key=lambda n: not n.get('resource-id', '').startswith('android:id/'))
        nav = next((n for n in root.iter('node') if 'Navegação do celular' in (n.get('text') or n.get('content-desc') or '') and len(rect(n)) == 4 and rect(n)[1] > 0), None)
        bottom_limit = rect(nav)[1] if nav is not None else height-24
        for node in nodes:
            left, top, right, bottom = rect(node)
            if right > left and bottom > top and 24 < (top+bottom)//2 < bottom_limit:
                adb('shell', 'input', 'tap', str((left+right)//2), str((top+bottom)//2))
                time.sleep(1)
                return
        adb('shell', 'input', 'swipe', str(width//2), str(height-220), str(width//2), '160', '400')
    labels = [n.get('text') or n.get('content-desc') for n in root.iter('node') if n.get('text') or n.get('content-desc')]
    raise AssertionError('Could not scroll to and tap: ' + text + '; labels: ' + ' | '.join(labels)[:1200])

try:
    tap('Novo documento')
    tap('Preparar um orçamento')
    phase = 'initial-form-action'
    bottom_before = rect(find('Continuar para serviços'))[3]
    root = snapshot()
    fields = [node for node in root.iter('node') if node.get('class') == 'android.widget.EditText' and len(rect(node)) == 4 and rect(node)[3] > rect(node)[1]]
    for _ in range(8):
        if fields:
            break
        screen_width, screen_height = device.window_size()
        adb('shell', 'input', 'swipe', str(screen_width//2), str(screen_height-180), str(screen_width//2), '180', '350')
        root = snapshot()
        fields = [node for node in root.iter('node') if node.get('class') == 'android.widget.EditText' and len(rect(node)) == 4 and rect(node)[3] > rect(node)[1]]
    assert fields, 'The document form must expose editable fields to Android accessibility'
    left, top, right, bottom = rect(fields[0])
    adb('shell', 'settings', 'put', 'secure', 'show_ime_with_hard_keyboard', '1')
    adb('shell', 'input', 'tap', str((left+right)//2), str((top+bottom)//2))
    adb('shell', 'input', 'text', 'ClienteAndroid')
    phase = 'keyboard-resize'
    keyboard_adjusted = False
    for _ in range(8):
        root = snapshot()
        if any('ClienteAndroid' in node.get('text', '') for node in root.iter('node')):
            action = next((node for node in root.iter('node') if node.get('text') == 'Continuar para serviços' or node.get('content-desc') == 'Continuar para serviços'), None)
            if action is not None and len(rect(action)) == 4 and 0 < rect(action)[3] < bottom_before - 100:
                keyboard_adjusted = True
                break
        time.sleep(1)
    assert keyboard_adjusted, 'The form action must move above the actual Android keyboard while retaining typed text'
    (out / 'phone-keyboard.png').write_bytes(adb('exec-out', 'screencap', '-p'))
    phase = 'first-back-hides-keyboard'
    adb('shell', 'input', 'keyevent', '4')
    for _ in range(15):
        if rect(find('Continuar para serviços'))[3] >= bottom_before - 20:
            break
        time.sleep(0.3)
    else:
        raise AssertionError('First Back must restore the full form height before the second Back')
    phase = 'second-back-confirms-discard'
    adb('shell', 'input', 'keyevent', '4')
    for _ in range(8):
        root = snapshot()
        if any('Descartar esta edição' in node.get('text', '') for node in root.iter('node')):
            break
        time.sleep(1)
    else:
        raise AssertionError('Android Back must confirm before discarding the document form')
    tap('Cancelar')
    root = snapshot()
    assert any('ClienteAndroid' in node.get('text', '') for node in root.iter('node')), 'Canceling Back must retain the document fields'
    (out / 'phone-form.png').write_bytes(adb('exec-out', 'screencap', '-p'))
    (out / 'phone-check.txt').write_text('PASS: native touch navigation, actual IME resize, Back confirmation and retained input.\n')
    print('Native phone flow passed: real keyboard, visible form action, Android Back and retained input.')
except Exception as error:
    print('::error title=Android phone flow::' + phase + ': ' + str(error).replace('\n', ' ')[:2400], flush=True)
    raise
