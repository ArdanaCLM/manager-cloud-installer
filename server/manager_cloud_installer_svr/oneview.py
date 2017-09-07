# import config.config as config
from flask import Blueprint
from flask import request
import util

bp = Blueprint('oneview', __name__)

# ONEVIEW_URL = config.get("oneview", "url")

"""
Calls to HPE OneView
"""


@bp.route("/api/v1/ov/servers")
def ov_server_list():
    # For now, use only the JSON_SERVER
    url = util.JSON_SERVER + "/servers"
    return util.forward(url, request)


@bp.route("/api/v1/ov/servers/<id>")
def ov_server_details(id):
    # For now, use only the JSON_SERVER
    url = util.JSON_SERVER + "/servers/" + id
    return util.forward(url, request)
