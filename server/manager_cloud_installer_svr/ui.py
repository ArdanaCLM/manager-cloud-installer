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
