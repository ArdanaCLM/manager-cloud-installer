import config.config as config
from flask import abort
from flask import Blueprint
from flask import jsonify
from flask import request
import json
from tinydb import Query
from tinydb import TinyDB

bp = Blueprint('ui', __name__)
JSON_SERVER = config.get("general", "json_server")

"""
Calls handled locally to support the UI
"""

progress_file = config.get("general", "progress_file")
db_file = config.get("general", "db_file")
db = TinyDB(db_file)
server_table = db.table('servers')


@bp.route("/api/v1/progress", methods=['GET'])
def get_progress():

    contents = ''
    try:
        with open(progress_file) as f:
            contents = json.load(f)

    except IOError:
        pass

    return jsonify(contents)


@bp.route("/api/v1/progress", methods=['POST'])
def save_progress():

    data = request.get_json()

    try:
        with open(progress_file, "w") as f:
            json.dump(data, f)
        return 'Success'
    except Exception:
        abort(400)


@bp.route("/api/v1/server", methods=['POST'])
def insert_servers():
    try:
        data = request.get_json()
        if isinstance(data, list):
            server_table.insert_multiple(server for server in data)
        else:
            server_table.insert(data)
        return "Success"
    except Exception:
        abort(400)


@bp.route("/api/v1/server", methods=['GET'])
def get_servers():

    return jsonify(server_table.all())


@bp.route("/api/v1/server/<name>", methods=['GET'])
def get_server(name):

    server = Query()
    try:
        return jsonify(server_table.get(server.name == name))
    except Exception:
        abort(400)


@bp.route("/api/v1/server/<name>", methods=['PUT'])
def update_server(name):

    server = Query()
    try:
        server_table.remove(server.name == name)
        data = request.get_json()
        server_table.insert(data)
        return "Success"
    except Exception:
        abort(400)


@bp.route("/api/v1/server/<name>", methods=['DELETE'])
def delete_server(name):

    server = Query()
    try:
        server_table.remove(server.name == name)
        return "Success", 200
    except Exception:
        abort(400)
