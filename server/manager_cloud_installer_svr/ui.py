# (c) Copyright 2017 SUSE LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import config.config as config
from flask import abort
from flask import Blueprint
from flask import jsonify
from flask import request
import json
import re
import subprocess
from tinydb import Query
from tinydb import TinyDB

bp = Blueprint('ui', __name__)
SUCCESS = {"success": True}

progress_file = config.get("general", "progress_file")
db_file = config.get("general", "db_file")
db = TinyDB(db_file)
server_table = db.table('servers')

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
    """Inserts a list of servers to the server table.

    'id' and 'source' fields must be unique

    **Example Request**:

    .. sourcecode:: http

    POST /api/v1/server HTTP/1.1
         where the body contains a list of server dictionaries
    """
    server = Query()
    try:
        data = request.get_json()

        # Check for dupes and missing id & server keys
        for entry in data:
            if not set(['id', 'source']).issubset(entry):
                return jsonify(error="There is one or more entries missing "
                                     "id or source"), 400
            sid = entry['id']
            src = entry['source']
            server_entries = server_table.search(
                (server.id == sid) & (server.source == src))
            if server_entries:
                return jsonify(error="There is an entry already matching "
                                     "id=%s and server=%s" % (sid, src)), 400

        server_table.insert_multiple(server for server in data)
        return jsonify(SUCCESS)
    except Exception:
        abort(400)


@bp.route("/api/v1/server", methods=['GET'])
def get_servers():
    """Returns a list of server(s) given an 'id' and/or 'source'

    'source' is a comma-delimited list joined by an OR statement
    'id' and 'source' are joined by an AND statement

    **Example Request**:

    .. sourcecode:: http

    GET /api/v1/server?id=myid&source=src1,src2 HTTP/1.1
    """
    q = Query()
    try:
        sid = request.args.get('id', None)
        src = request.args.get('source', None)
        if not sid and not src:
            return jsonify(server_table.all())
        query_str = create_query_str(sid, src)
        exec("results = server_table.search(%s)" % query_str)
        return jsonify(results)
    except Exception:
        abort(400)


@bp.route("/api/v1/server", methods=['PUT'])
def update_server():
    """Update a single server entry (dict) into the server table.

    'id' and 'source' fields must be unique

    **Example Request**:

    .. sourcecode:: http

    PUT /api/v1/server HTTP/1.1
         where the body contains a dictionary containing a server's details
    """
    server = Query()
    try:
        entry = request.get_json()
        if not set(['id', 'source']).issubset(entry):
            return jsonify(error="There is one or more entries missing "
                                 "id or source"), 400
        sid = entry['id']
        src = entry['source']
        server_entries = server_table.search(
            (server.id == sid) & (server.source == src))
        if not server_entries:
            return jsonify(error="id:%s; source:%s not found "
                                 "to be updated" % (sid, src)), 404
        server_table.remove(
            (server.id == sid) & (server.source == src))
        server_table.insert(entry)
        return jsonify(SUCCESS)
    except Exception:
        abort(400)


@bp.route("/api/v1/server", methods=['DELETE'])
def delete_server():
    """Removes servers given a set of search parameters.

    The search parameters used are the same as get_servers()

    **Example Request**:

    .. sourcecode:: http

    DELETE /api/v1/server?id=myid&source=src1,src2 HTTP/1.1
    """
    q = Query()
    try:
        sid = request.args.get('id', None)
        src = request.args.get('source', None)
        if not sid and not src:
            return jsonify(error="id and/or source must be specified"), 400
        query_str = create_query_str(sid, src)
        exec("server_table.remove(%s)" % query_str)
        return jsonify(SUCCESS)
    except Exception:
        abort(400)


def create_query_str(sid, src):
    queries = []
    if sid:
        queries.append("(q.id == \"%s\")" % sid)

    if src:
        clauses = []
        for source in src.split(','):
            clauses.append('(q.source == "%s")' % source)
        queries.append("(%s)" % '|'.join(clauses))

    return '&'.join(queries)


@bp.route("/api/v1/ips", methods=['GET'])
def get_ips():
    """Returns list of ip addresses of the local host

    **Example Request**:

    .. sourcecode:: http

    GET /api/v1/ips HTTP/1.1

    **Example Response**:

    .. sourcecode:: http
    HTTP/1.1 200 OK

    [
        "127.0.0.1",
        "192.168.1.200"
    ]
    """

    ips = []
    pattern = re.compile(r'inet +([0-9.]+)')

    try:
        lines = subprocess.check_output(["ip", "-o", "-4", "addr", "show"])
        for line in lines.split('\n'):
            match = pattern.search(line)
            if match:
                ips.append(match.group(1))

    except subprocess.CalledProcessError:
        pass

    return jsonify(ips)

@bp.route("/api/v1/external_urls", methods=['GET'])
def get_external_urls():
    """Returns list of external URLs the customer can access via the browser
       once cloud deployment is complete

    **Example Request**:

    .. sourcecode:: http

    GET /api/v1/external_urls HTTP/1.1

    **Example Response**:

    .. sourcecode:: http
    HTTP/1.1 200 OK

    {
        "horizon": "https://192.168.245.6:443", 
        "opsconsole": "https://192.168.245.5:9095"
    }
    """
    config.reload_config()

    urls = config.get_all("urls")

    return jsonify(urls)

