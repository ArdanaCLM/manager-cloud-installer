from flask import Blueprint
from flask import request
from . import util

bp = Blueprint('ui', __name__)

"""
Calls handled locally to support the UI
"""


@bp.route("/api/v1/progress")
def progress():

    # For now, use only the JSON_SERVER
    url = util.JSON_SERVER + "/installprogress"
    return util.forward(url, request)
