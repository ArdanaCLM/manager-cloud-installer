from flask import abort
from flask import Blueprint
from flask import jsonify
from flask import request
import json
import os

bp = Blueprint('ui', __name__)

"""
Calls handled locally to support the UI
"""

# This location should be in a config file
progress_file = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                              "progress.json"))


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
