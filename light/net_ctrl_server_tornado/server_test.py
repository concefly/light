# -*- coding:utf-8 -*-

import tornado.ioloop
import tornado.web
import tornado.httpserver

import datetime
import json
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import db_access as db

def convertDatetime(obj):
	return [int(i) for i in obj.strftime('%Y-%m-%d-%H-%M-%S').split('-')]

class sys_info(tornado.web.RequestHandler):
	def get(self):
		func = self.get_argument('callback')
		d = {}
		d['cpu'] = 1
		d['mem'] = [0,0]
		d['disk'] = [0,0]
		d['time'] = [0,0,0,0,0,0,0]
		d = dict(state=200,message='ok',response=[d])
		re = "%s(%s)" %(func,json.dumps(d))
		self.write(re)

class group_online(tornado.web.RequestHandler):
	def get(self):
		func = self.get_argument('callback')
		req_zaddr = []
		try:
			req_zaddr = json.loads(self.get_argument('zaddr'))
		except:
			pass
		rel = dict(state=200,message='ok',response=[])
		if req_zaddr:
			for z in req_zaddr:
				pee = db.GroupOnline.selectBy(zaddr=z)[0]
				rel['response'].append(dict(zaddr=pee.zaddr,ChipCode=pee.ChipCode,DevCount=pee.DevCount,time=convertDatetime(pee.time)))
		else:
			for pee in db.GroupOnline.selectBy():
				rel['response'].append(dict(zaddr=pee.zaddr,ChipCode=pee.ChipCode,DevCount=pee.DevCount,time=convertDatetime(pee.time)))
		self.write( "%s(%s)" %(func,json.dumps(rel)) )

if __name__ == "__main__":
	db.setURI()
	PublishPath = os.path.join(os.path.dirname(os.path.abspath(__file__)),'publish')
	ll = []
	ll.append((r"/api/sys_info",sys_info))
	ll.append((r"/api/group_online",group_online))
	ll.append((r"/(.*)",tornado.web.StaticFileHandler,{'path':PublishPath}))
	app = tornado.web.Application(ll)
	http_server = tornado.httpserver.HTTPServer(app)
	http_server.listen(8000)
	tornado.ioloop.IOLoop.instance().start()
