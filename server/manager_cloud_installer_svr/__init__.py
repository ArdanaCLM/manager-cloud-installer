from eventlet import monkey_patch as monkey_patch
from flask_socketio import SocketIO
# IMPORTANT!
# When using eventlet, monkey_patch is needed in order to propertly handle
# IO asyncronously.  Without this, the reading of stdout from the playbook
# run will block until after that playbook has finished.
monkey_patch()


# When using eventlet, it is important to monkeypatch so that the IO does not
# hang.  When using the "threading" model, long polling is used instead of
# WebSockets, and its performance is a bit lower
socketio = SocketIO(async_mode="eventlet")
