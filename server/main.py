from config import config
from flask import Flask
from flask_cors import CORS
import logging
from manager_cloud_installer_svr import server
from manager_cloud_installer_svr import socketio

logging.basicConfig(level=logging.DEBUG)

LOG = logging.getLogger(__name__)
app = Flask(__name__)
app.register_blueprint(server.bp)
CORS(app)

if __name__ == "__main__":

    flask_config = config.get_flask_config()
    port = flask_config.pop('port', 8081)

    app.config.from_mapping(config.get_flask_config())

    # app.run(debug=True)
    socketio.init_app(app)
    socketio.run(app, port=port, use_reloader=True)
