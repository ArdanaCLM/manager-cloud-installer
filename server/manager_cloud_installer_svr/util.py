# (c) Copyright 2017 SUSE LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import config.config as config
import requests
import socket
from flask import abort

USE_JSON_SERVER_ONLY = config.get("testing", "mock")
JSON_SERVER = config.get("general", "json_server")
TIMEOUT = 2

# Hook function for redirecting all traffic to JSON_SERVER
def build_url(base, url):

    if USE_JSON_SERVER_ONLY:
        return JSON_SERVER + "/" + url
    else:
        return base + url


# Forward the url to the given destination
def forward(url, request):

    req = requests.Request(method=request.method, url=url, params=request.args,
                           headers=request.headers, data=request.data)

    resp = requests.Session().send(req.prepare())

    return (resp.text, resp.status_code, resp.headers.items())


def ping(host, port):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(TIMEOUT)
        s.connect((host, port))
    except Exception:
        abort(404)
