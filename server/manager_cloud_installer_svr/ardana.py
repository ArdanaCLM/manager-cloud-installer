import config.config as config
from flask import Blueprint
from flask import request
from . import util

bp = Blueprint('ardana', __name__)

ARDANA_URL = config.get("ardana", "url")


@bp.route("/api/v1/clm/<path:url>", methods=['GET', 'POST', 'PUT', 'DELETE'])
def ardana(url):

    # TODO(gary): Add logic to handle specific URLs that should *not*
    # (yet) be routed to the ARDANA_SERVER
    url = util.build_url(ARDANA_URL + "/api/v2/", url)
    return util.forward(url, request)
