#!/usr/bin/python
# or
# python -i inspector.py

# (c) Copyright 2017 SUSE LLC

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
