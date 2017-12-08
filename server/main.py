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
from config import config
from flask import Flask
from flask_cors import CORS
import logging
from manager_cloud_installer_svr import ardana
from manager_cloud_installer_svr import oneview
from manager_cloud_installer_svr import socket_proxy
from manager_cloud_installer_svr import socketio
from manager_cloud_installer_svr import suse_manager
from manager_cloud_installer_svr import ui

# attempt to set the log file to /var/log/cloudinstaller/install.log, but if its not writable, still configure
# default logging level to DEBUG
try:
    logging.basicConfig(level=logging.DEBUG, filename='/var/log/cloudinstaller/install.log')
except IOError as e:
    logging.basicConfig(level=logging.DEBUG)

LOG = logging.getLogger(__name__)
app = Flask(__name__,
            static_url_path='',
            static_folder='web')
app.register_blueprint(ardana.bp)
app.register_blueprint(ui.bp)
app.register_blueprint(oneview.bp)
app.register_blueprint(suse_manager.bp)
app.register_blueprint(socket_proxy.bp)
CORS(app)

@app.route('/')
def root():
    return app.send_static_file('index.html')

if __name__ == "__main__":

    flask_config = config.get_all('flask', caps=True)
    port = flask_config.pop('PORT', 8081)
    host = flask_config.pop('HOST', '127.0.0.1')

    app.config.from_mapping(config.get_all('flask', caps=True))

    # app.run(debug=True)
    socketio.init_app(app)
    socketio.run(app, host=host, port=port, use_reloader=True)
