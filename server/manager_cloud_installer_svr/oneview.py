# (c) Copyright 2017 SUSE LLC
import config.config as config
from flask import abort
from flask import Blueprint
from flask import request
from flask import jsonify
from util import ping
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
    host = creds['host']
    try:
        ping(host, 443)
    except Exception as e:
        return jsonify(error=str(e)), 404

    verify = True
    secured = request.headers.get('Secured')
    if secured == 'false':
        verify = False
    try:
        url = "https://" + host + "/rest/login-sessions"
        headers = {'X-Api-Version': '200', 'Content-Type': 'application/json'}
        data = {'userName': creds['username'], 'password': creds['password']}
        response = requests.post(url, data=json.dumps(data), headers=headers, verify=verify)
    except Exception as e:
        if 'SSLError' in str(e):
            return jsonify(error=str(e)), 403
        else:
            return jsonify(error=str(e)), 401

    if not response.status_code == 200:
        return jsonify(error=response.json()['message']), 400

    return jsonify(response.json())


@bp.route("/api/v1/ov/servers")
def ov_server_list():
    if util.USE_JSON_SERVER_ONLY:
        return util.forward(util.build_url(None, '/servers'), request)

    verify = True
    secured = request.headers.get('Secured')
    if secured == 'false':
        verify = False

    key = request.headers.get('Auth-Token')
    url = request.headers.get('Ov-Url')
    try:
        request_url = url + '/rest/server-hardware?start=0&count=-1&sort=position:desc'
        head = {'Auth': key, 'X-Api-Version': '200'}
        response = requests.get(request_url, headers=head, verify=verify)
        return jsonify(response.json())
    except Exception:
        abort(400)


@bp.route("/api/v1/ov/servers/<id>")
def ov_server_details(id):
    if util.USE_JSON_SERVER_ONLY:
        return util.forward(util.build_url(None, '/servers' + id), request)

    verify = True
    secured = request.headers.get('Secured')
    if secured == 'false':
        verify = False

    key = request.headers.get('Auth-Token')
    url = request.headers.get('Ov-Url')
    try:
        request_url = url + '/rest/server-hardware/' + id
        head = {'Auth': key, 'X-Api-Version': '200'}
        response = requests.get(request_url, headers=head, verify=verify)
        return jsonify(response.json())
    except Exception:
        abort(400)
