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
from . import util
import config.config as config
from flask import Blueprint
from flask import request

bp = Blueprint('ardana', __name__)

ARDANA_URL = config.get("ardana", "url")


@bp.route("/api/v1/clm/<path:url>", methods=['GET', 'POST', 'PUT', 'DELETE'])
def ardana(url):

    # TODO(gary): Add logic to handle specific URLs that should *not*
    # (yet) be routed to the ARDANA_SERVER
    url = ARDANA_URL + "/api/v2/" + url
    return util.forward(url, request)
