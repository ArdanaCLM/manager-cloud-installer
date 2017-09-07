import config.config as config
import requests

USE_JSON_SERVER_ONLY = config.get("testing", "mock")
JSON_SERVER = config.get("general", "json_server")


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
