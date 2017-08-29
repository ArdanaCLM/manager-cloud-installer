from flask import Blueprint
from flask import request
from flask_socketio import emit
from flask_socketio import join_room
from urlparse import urlparse
import config.config as config
import logging
import urllib2

from . import util
from . import socketio

LOG = logging.getLogger(__name__)

bp = Blueprint('socket_proxy', __name__)

ARDANA_URL = config.get("ardana", "url")

@socketio.on('playbookstatus')
def on_message(message, name):
    # propagate the message back to other listeners
    socketio.emit(message, name)

@socketio.on('ardanasocketjoin')
def on_socketjoin(room):
    join_room(room)

@socketio.on('ardanasocketproxy')
def on_socketproxy(connection_id, service, room):
    #join the local room for communicating back to the calling component
    join_room(room)

    #ask the ardana service to join the same connection
    parsed_url = urlparse(request.url_root)
    url = util.build_url(ARDANA_URL + "/api/v2/" + service + "/addconnection/" +
                         connection_id + "/" + \
                         room + "/" + \
                         parsed_url.hostname + "/" + \
                         str(parsed_url.port), "")
    try:
        response = urllib2.urlopen(url, timeout=5)
    except Exception as e:
        LOG.error("Got exception connecting to ardana service:" , e)