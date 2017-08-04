import config.config as config
from flask import Blueprint
from flask import jsonify
from . import util
import ssl
import xmlrpclib

bp = Blueprint('suse-manager', __name__)

SUSE_MANAGER_URL = config.get("suse-manager", "url")
SUSE_MANAGER_USERNAME = config.get("suse-manager", "username")
SUSE_MANAGER_PASSWORD = config.get("suse-manager", "password")
INSECURE = config.get("suse-manager", "insecure", False)

"""
Calls to SUSE Manager
"""


def connect():
    context = None
    if INSECURE:
        context = ssl._create_unverified_context()

    client = xmlrpclib.Server(SUSE_MANAGER_URL, verbose=0, context=context)
    key = client.auth.login(SUSE_MANAGER_USERNAME, SUSE_MANAGER_PASSWORD)
    return (client, key)


@bp.route("/api/v1/sm/servers")
def sm_server_list():

    if util.USE_JSON_SERVER_ONLY:
        return util.forward(None, '/servers')

    client, key = connect()
    server_list = client.system.listActiveSystems(key)
    for server in server_list:
        # last_checkin is an object, which is not json-serializable
        server['last_checkin'] = str(server['last_checkin'])

    return jsonify(server_list)


@bp.route("/api/v1/sm/servers/<id>")
def sm_server_details(id):

    if util.USE_JSON_SERVER_ONLY:
        return util.forward(None, '/servers/' + id)

    client, key = connect()
    detail_list = client.system.listActiveSystemsDetails(key, int(id))

    detail = detail_list[0]
    # last_checkin is an object, which is not json-serializable
    detail['last_checkin'] = str(detail['last_checkin'])

    return jsonify(detail)
