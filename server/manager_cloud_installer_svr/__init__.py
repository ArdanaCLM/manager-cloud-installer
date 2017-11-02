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
