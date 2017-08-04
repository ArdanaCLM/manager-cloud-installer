import config.config as config
from flask import Blueprint
from flask import request
import requests

bp = Blueprint('server', __name__)

USE_JSON_SERVER_ONLY = config.get("testing", "mock")
ARDANA_SERVER = config.get("general", "ardana_server")
JSON_SERVER = config.get("general", "json_server")


# Forward the url to the given destination
def forward(url):

    # TODO(gary): Add logic to handle specific URLs that should *not*
    # (yet) be routed to the ARDANA_SERVER

    req = requests.Request(method=request.method, url=url,
                           headers=request.headers, data=request.data)

    resp = requests.Session().send(req.prepare())

    return (resp.text, resp.status_code, resp.headers.items())


#######################
# Calls handled locally
#######################
@bp.route("/api/v1/progress")
def progress():
    url = JSON_SERVER + "/installprogress"
    return forward(url)


#################################################
# Calls to Ardana Cloud Lifecycle Manager service
#################################################
@bp.route("/api/v1/clm/<path:url>", methods=['GET', 'POST', 'PUT', 'DELETE'])
def ardana(url):

    # TODO(gary): Add logic to handle specific URLs that should *not*
    # (yet) be routed to the ARDANA_SERVER

    if USE_JSON_SERVER_ONLY:
        url = JSON_SERVER + "/" + url
    else:
        url = ARDANA_SERVER + "/api/v2/" + url

    return forward(url)


#######################
# Calls to SUSE Manager
#######################
@bp.route("/api/v1/sm/servers")
def sm_server_list():
    # get this from json-server
    pass


@bp.route("/api/v1/sm/servers/<id>")
def sm_server_details(id):
    # get this from json-server
    pass


#########################
# Calls to HPE OneView(c)
#########################
@bp.route("/api/v1/ov/servers")
def ov_server_list():
    # get this from json-server
    pass


@bp.route("/api/v1/ov/servers/<id>")
def ov_server_details(id):
    # get this from json-server
    pass
