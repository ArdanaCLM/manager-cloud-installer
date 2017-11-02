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
from ConfigParser import SafeConfigParser
import logging
import os

LOG = logging.getLogger(__name__)

parser = SafeConfigParser()

default_config = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                               'defaults.cfg'))

config_files = [default_config]
local_config = os.path.normpath(os.path.join(os.path.dirname(__file__), '..',
                                             'local.cfg'))
if os.path.exists(local_config):
    config_files.append(local_config)

LOG.info("Loading config files %s", config_files)
# This will fail with an exception if the config file cannot be loaded
parser.read(config_files)


def normalize(val):
    # Coerce value to an appropriate python type
    if val.lower() in ("yes", "true"):
        return True

    if val.lower() in ("no", "false"):
        return False

    try:
        return int(val)
    except ValueError:
        try:
            return float(val)
        except ValueError:
            pass

    return val


def get_flask_config():
    """Return all items in the [flask] section.

    The keys are converted to upercase as required by flask.  Since
    SafeConfigParser returns all values as strings
    """
    return {k.upper(): normalize(v) for k, v in parser.items('flask')}


def get(*args, **argv):
    return normalize(parser.get(*args, **argv))


def get_dir(dir_name):
    path = parser.get('paths', dir_name)

    # Relative paths are resolved relative to the top-level directory
    if not path.startswith('/'):
        top_dir = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                                ".."))
        path = os.path.abspath(os.path.join(top_dir, path))

    return path
