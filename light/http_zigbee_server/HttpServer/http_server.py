# -*- coding:utf-8 -*-

import tornado.ioloop
import tornado.web
import tornado.httpserver
import tornado.options as opts
import tornado.log as log
import tornado.iostream

import sys
import os

import api.views

#~ 文件路径
THIS_DIR = os.path.dirname(os.path.abspath(__file__))

def config_urls():
	'''返回配置列表'''
	ll = []
	#~ api
	ll.append((r"/api/dynamic",api.views.dynamic))
	ll.append((r"/api/group_online",api.views.group_online))
	ll.append((r"/api/group_fix_info",api.views.group_fix_info))
	ll.append((r"/api/group_var_info",api.views.group_var_info))
	ll.append((r"/api/dev_online",api.views.dev_online))
	ll.append((r"/api/dev_fix_info",api.views.dev_fix_info))
	ll.append((r"/api/dev_var_info",api.views.dev_var_info))
	ll.append((r"/api/dev_dyn00",api.views.dev_dyn00))
	ll.append((r"/api/dev_dyn01",api.views.dev_dyn01))
	#~ static
	StaticPath = os.path.join(THIS_DIR,'static')
	ll.append((r"/(.*)",tornado.web.StaticFileHandler,{'path':StaticPath}))
	#~ 
	return ll

#~ 网页服务器
#~ 全局变量 http_server
http_server = tornado.httpserver.HTTPServer( tornado.web.Application(config_urls()) )
http_server.listen(opts.options.net_ListenPort)
