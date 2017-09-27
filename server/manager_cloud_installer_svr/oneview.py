import config.config as config
from flask import Blueprint
from flask import request
from flask import jsonify
import util
import requests
import json


bp = Blueprint('oneview', __name__)

INSECURE = config.get("suse-manager", "insecure", False)

"""
Calls to HPE OneView
"""


@bp.route("/api/v1/ov/connection_test", methods=['POST'])
def connection_test():
    creds = request.get_json() or {}
    verify = True
    if INSECURE:
        verify = False
    try:
        url = "https://" + creds['host'] + "/rest/login-sessions"
        headers = {'X-Api-Version': '200', 'Content-Type': 'application/json'}
        data = {'userName': creds['username'], 'password': creds['password']}
        response = requests.post(url, data=json.dumps(data), headers=headers, verify=verify)
    except Exception:
        return jsonify(error='Connection Error'), 403

    if not response.status_code == 200:
        return jsonify(error=response.json()['message']), 400

    return jsonify(response.json())


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
