
# -*- coding:utf-8 -*-

import tornado.ioloop
import tornado.web
import tornado.httpserver

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import api.views

PublishPath = os.path.join(os.path.dirname(os.path.abspath(__file__)),'static')
ll = []

#~ ll.append((r"/api/sys_info",api.views.sys_info))
ll.append((r"/api/group_online",api.views.group_online))
ll.append((r"/api/group_fix_info",api.views.group_fix_info))
ll.append((r"/api/group_var_info",api.views.group_var_info))
ll.append((r"/api/dev_online",api.views.dev_online))
ll.append((r"/api/dev_fix_info",api.views.dev_fix_info))
ll.append((r"/api/dev_var_info",api.views.dev_var_info))
ll.append((r"/api/dev_dyn00",api.views.dev_dyn00))
ll.append((r"/api/dev_dyn01",api.views.dev_dyn01))

ll.append((r"/(.*)",tornado.web.StaticFileHandler,{'path':PublishPath}))
app = tornado.web.Application(ll)
http_server = tornado.httpserver.HTTPServer(app)
http_server.listen(8000)
tornado.ioloop.IOLoop.instance().start()
