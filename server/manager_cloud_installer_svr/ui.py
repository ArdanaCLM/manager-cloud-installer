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
SUCCESS = {"success": True}

progress_file = config.get("general", "progress_file")
db_file = config.get("general", "db_file")
db = TinyDB(db_file)
server_table = db.table('servers')
discovered_servers_table=db.table('discovered_servers')

"""
Calls handled locally to support the UI
"""


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
        return jsonify(SUCCESS)
    except Exception:
        abort(400)


# /server CRUD operations
@bp.route("/api/v1/server", methods=['POST'])
def insert_servers():
    server = Query()
    try:
        data = request.get_json()
        if isinstance(data, list):
            # Check for dupes and missing name keys
            existing_hosts = []
            has_missing_name_key = False
            error_msg = ''
            for entry in data:
                if 'name' not in entry:
                    has_missing_name_key = True
                    continue
                name = entry['name']
                server_entry = server_table.get(server.name == name)
                if server_entry:
                    existing_hosts.append(name)
                if has_missing_name_key:
                    error_msg += 'Data set contains entries with missing ' \
                                 'name keys.  '
                if existing_hosts:
                    error_msg += "The following servers already exist: "
                    error_msg += ', '.join(existing_hosts)
            if error_msg:
                return jsonify(error=error_msg), 400
            server_table.insert_multiple(server for server in data)
        else:
            # validate dictionary entry
            if 'name' not in data:
                return jsonify(error="Entry is missing the name key"), 400
            name = data['name']
            server_entry = server_table.get(server.name == name)
            if server_entry:
                return jsonify(error="Entry for %s already exists" % name), 400

            server_table.insert(data)
        return jsonify(SUCCESS)
    except Exception:
        abort(400)


@bp.route("/api/v1/server", methods=['GET'])
def get_servers():
    return jsonify(server_table.all())


@bp.route("/api/v1/server/<name>", methods=['GET'])
def get_server(name):
    server = Query()
    try:
        server_entry = server_table.get(server.name == name)
        if server_entry:
            return jsonify(server_table.get(server.name == name))
        else:
            return jsonify(error="%s not found" % name), 404
    except Exception:
        abort(400)


@bp.route("/api/v1/server/<name>", methods=['PUT'])
def update_server(name):
    server = Query()
    try:
        server_entry = server_table.get(server.name == name)
        if server_entry:
            server_table.remove(server.name == name)
            data = request.get_json()
            server_table.insert(data)
            return jsonify(SUCCESS)
        else:
            return jsonify(error="%s not found to be updated" % name), 404
    except Exception:
        abort(400)


@bp.route("/api/v1/server/<name>", methods=['DELETE'])
def delete_server(name):
    server = Query()
    try:
        server_table.remove(server.name == name)
        return jsonify(SUCCESS)
    except Exception:
        abort(400)

@bp.route("/api/v1/discovered_servers", methods=['GET'])
def get_discovered_servers():
    return jsonify(discovered_servers_table.all())

@bp.route("/api/v1/discovered_servers", methods=['POST'])
def insert_discovered_servers():
    try:
        data = request.get_json()
        if isinstance(data, list):
            discovered_servers_table.purge()
            discovered_servers_table.insert_multiple(server for server in data)
            return jsonify(SUCCESS)
        else:
            abort(400)
    except Exception:
        abort(400)