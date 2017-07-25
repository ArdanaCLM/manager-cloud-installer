
# Requires:
#   https://pypi.python.org/pypi/websocket-client/
#   pip install websocket-client
# usage:
#    python -i ws.py
#    pprint outputs
#    run_salt_command('udev.exportdb', '*')
import json
import os
import time
import threading
import ssl
import websocket


from pprint import pprint
from urlparse import urlparse

websocket.enableTrace(True)
ws = None
outputs = []
# login from the browser, and copy cookies, it should be something like this
#cookie = "DWRSESSIONID=c27VBRxV8fY4yD4wRbBICchKXQl; JSESSIONID=06B1EC5AC4243FEF33C842C32C8F158E; pxt-session-cookie=93x3b9a09b6e8662064fef12f11ce232817ef2358e05e22f5807ad9016ad85ccc21 "
cookie = os.environ['MANAGER_COOKIE']
parsed = urlparse(os.environ['MANAGER_URL'])
managerhostport = parsed.hostname


def on_error(ws, error):
    print 'errord:', error


def on_close(ws):
    print "### closed ###"


def on_open(ws):
    print "### opened ###"


def run_salt_command(cmd, on):
    ws.send(json.dumps(dict(
        preview=False,
        target=on,
        command='salt-call --local --log-level quiet --out=json %s' % cmd
        )))


def on_message(ws, message):
    message = json.loads(message)
    print message
    outputs.append(message)


def retry(close=True):
    global ws
    if close:
        ws.close()
    connto = "wss://%s/rhn/websocket/minion/remote-commands" % managerhostport
    ws = websocket.WebSocketApp(connto,
                                cookie=cookie,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close,
                                )
    ws.on_open = on_open

    kwargs = {'sslopt': {"cert_reqs": ssl.CERT_NONE}}
    threading.Thread(target=ws.run_forever, kwargs=kwargs).start()
    time.sleep(10)
    ws.send(json.dumps({'preview': True, 'target': '*'}))

retry(False)
