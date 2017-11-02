#!/usr/bin/python
# or
# python -i inspector.py

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

import os
# import ssl
import xmlrpclib

from pprint import pprint

# use the .inspecrc file in this directory
MANAGER_URL = os.environ['MANAGER_URL']
MANAGER_LOGIN = os.environ['MANAGER_LOGIN']
MANAGER_PASSWORD = os.environ['MANAGER_PASSWORD']

client = xmlrpclib.Server(MANAGER_URL, verbose=0)
# for ssl
# context=ssl._create_unverified_context()
# client = xmlrpclib.Server(MANAGER_URL, verbose=0, context=context)

key = client.auth.login(MANAGER_LOGIN, MANAGER_PASSWORD)
userlist = client.user.list_users(key)
pprint(userlist)

sys_list = client.system.listActiveSystems(key)
pprint(sys_list)

detailsfor = [sys['id'] for sys in sys_list]
sys_list = client.system.listActiveSystemsDetails(key, detailsfor)
pprint(sys_list)

client.auth.logout(key)
