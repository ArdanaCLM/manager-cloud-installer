..
 (c) Copyright 2017 SUSE LLC

==============================
Manager Cloud Installer Server
==============================

REST server for manager cloud installer

---------------
Getting Started
---------------

Optionally create the file ``local.cfg`` by copying the file
``config/defaults.cfg``.  This file contains configuration setting such as the
URL to the Ardana Service, and a ``mock`` setting (for directing *all* traffic
to the json server).

Start the service using::

   Use 'tox -e runserver' to start the server (on port 5000)

---
API
---

All REST endpoints begin with ``/api/v1``.  The following endpoints are
supported:

  ``/api/v1/progress`` (``GET`` or ``POST``)
       Data to track the progress of the installer.

  ``/api/v1/server`` (``GET``,``POST``,``PUT``,``DELETE``)
       Scratch space for general server details

  ``/api/v1/sm/servers`` (``GET``)
       Retrieves a list of servers from SUSE Manager

  ``/api/v1/sm/servers/{id}`` (``GET``)
       Retrieves the details of the given server from SUSE Manager

  ``/api/v1/ov/servers`` (``GET``)
       Retrieves a list of servers from HPE OpenView

  ``/api/v1/ov/servers/{id}`` (``GET``)
       Retrieves the details of the given server from HPE OpenView

  ``/api/v1/clm/...``
       Requests to this URL are forwarded to the correspondingin 
       endpoint under ``/api/v2`` in the Ardana Service
