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
def on_message(message, name, room):
    # propagate the message back to other listeners
    socketio.emit(message, name, room=room)

@socketio.on('socketjoin')
def on_socketjoin(room):
    """Joins the specified socketroom

    socketio provides the concept of "rooms" for segmenting communication
    between components to avoid noise and unnecessary message filtering

    Args:
        room (str): The socketio room to join

    Returns:
        None: no return value
    """
    join_room(room)

@socketio.on('socketproxyinit')
def on_socketproxyinit(service, room):
    """Initializes a shared socket connection

    For remote components to share a socket connection through the shim
    layer, first one of the components must initialize the socket connection
    and be the first to join the intended room. Subsequent components
    joining will use the socketjoin event instead, which simply
    joins the room and does nothing else.

    This function currently services only the ardana service, though it
    could be expanded to support other remote services in the future.

    Once the init event comes in, a call to the remote service is made
    to a well known URL to trigger that service to join this
    socket connection

    The sequence is as follows:
    UI -> emit("socketproxyinit") -> joins specified room
    socketproxyemit -> URL call to Ardana service to add connection
    ardanaService -> connects to socket, emits socketjoin to join room

    Once this sequence has taken place, events will be relayed
    between the UI and Ardana service.

    The only explicit tie to Ardana is the URL called in this method
    and support for other services could be added by parameterizing
    the url. That was not done yet because the UI may not have
    a means of knowing where the ardana URL is. Another option
    would be a service->endpoint map maintained here

    Args:
        connection_id (str):
        service (str):
        room (str):

    Returns:
        None: no return value
    """
    #join the local room for communicating back to the calling component
    join_room(room)

    #ask the ardana service to join the same connection
    parsed_url = urlparse(request.url_root)
    url = util.build_url(ARDANA_URL + "/api/v2/" + service + "/addconnection/" +
                         room + "/" + \
                         parsed_url.hostname + "/" + \
                         str(parsed_url.port), "")
    try:
        response = urllib2.urlopen(url, timeout=5)
    except Exception as e:
        LOG.error("Got exception connecting to ardana service:" , e)