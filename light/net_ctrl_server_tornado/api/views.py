# -*- coding:utf-8 -*-

import tornado.web

import json
import datetime
import pony.orm as orm
import db_access as db

import time

def convertDatetime(obj):
	return obj.strftime('%Y-%m-%d T %H:%M:%S')

class group_online(tornado.web.RequestHandler):
	#~ 无请求值：返回所有记录
	def get(self):
		res = []
		with orm.db_session:
			groups = db.GroupOnline.select();
			for group in groups:
				d = {}
				d['zaddr'] = group.zaddr
				d['ChipCode'] = group.ChipCode
				d['DevCount'] = group.DevCount
				d['time'] = convertDatetime(group.time)
				res.append(d)
		self.write(json.dumps(res))
	
	def post(self):
		self.get()

class group_fix_info(tornado.web.RequestHandler):
	#~ 无请求值：返回所有记录
	def get(self):
		res = []
		with orm.db_session:
			groups = db.GroupFixInfo.select()
			for group in groups:
				d = {}
				d['zaddr'] = group.zaddr
				d['name'] = group.name
				d['describe'] = group.describe
				res.append(d)
		self.write(json.dumps(res))
	
	def post(self):
		self.get()

class group_var_info(tornado.web.RequestHandler):
	#~ 无请求值：返回所有记录
	#~ zaddr, ... 请求：修改并返回所有记录
	def get(self):
		req = self.request.arguments.copy()
		with orm.db_session:
			if req.has_key('zaddr'):
				#~ zaddr, ... 请求
				req_zaddr = int(req.pop('zaddr')[0])
				group = db.GroupVarInfo.get(zaddr=req_zaddr);
				if group==None:
					InitValue = {}
					InitValue['zaddr'] = req_zaddr
					for k in req:
						if k=='name':
							InitValue['name'] = req['name'][0]
						elif k=='describe':
							InitValue['describe'] = req['describe'][0]
					group = db.GroupVarInfo(**InitValue)
				else:
					group.name = name=req['name'][0]
					group.describe = name=req['describe'][0]
				db.commit()
			#~ 返回所有记录
		with orm.db_session:
			groups = db.GroupVarInfo.select()
			res = []
			for group in groups:
				d = {}
				d['zaddr'] = group.zaddr
				d['name'] = group.name
				d['describe'] = group.describe
				res.append(d)
		self.write(json.dumps(res))
	
	def post(self):
		self.get()

class dev_online(tornado.web.RequestHandler):
	#~ 无请求值：返回所有记录
	def get(self):
		res = []
		with orm.db_session:
			devs = db.DevOnline.select();
			for dev in devs:
				d = {}
				d['zaddr'] = dev.zaddr
				d['id'] = dev.did
				d['MajorNum'] = dev.MajorNum
				d['SubNum'] = dev.SubNum
				res.append(d)
		self.write(json.dumps(res))
	
	def post(self):
		self.get()

class dev_fix_info(tornado.web.RequestHandler):
	#~ 无请求值：返回所有记录
	def get(self):
		res = []
		with orm.db_session:
			devs = db.DevFixInfo.select()
			for dev in devs:
				d = {}
				d['zaddr'] = dev.zaddr
				d['id'] = dev.did
				d['name'] = dev.name
				d['describe'] = dev.describe
				res.append(d)
		self.write(json.dumps(res))
	
	def post(self):
		self.get()

class dev_var_info(tornado.web.RequestHandler):
	#~ 无请求值：返回所有记录
	#~ zaddr,id ... 请求：修改并返回所有记录
	def get(self):
		req = self.request.arguments.copy()
		with orm.db_session:
			if req.has_key('zaddr') and req.has_key('id'):
				#~ zaddr,id ... 请求
				req_zaddr = int(req.pop('zaddr')[0])
				req_id = int(req.pop('id')[0])
				dev = db.DevVarInfo.get(zaddr=req_zaddr,did=req_id);
				if dev==None:
					InitValue = {}
					InitValue['zaddr'] = req_zaddr
					InitValue['did'] = req_id
					for k in req:
						if k=='name':
							InitValue['name'] = req['name'][0]
						elif k=='describe':
							InitValue['describe'] = req['describe'][0]
					dev = db.DevVarInfo(**InitValue)
				else:
					dev.name = req['name'][0]
					dev.describe = req['describe'][0]
				db.commit()
		with orm.db_session:
			#~ 返回所有记录
			devs = db.DevVarInfo.select()
			res = []
			for dev in devs:
				d = {}
				d['zaddr'] = dev.zaddr
				d['id'] = dev.did
				d['name'] = dev.name
				d['describe'] = dev.describe
				res.append(d)
		self.write(json.dumps(res))
	
	def post(self):
		self.get()

class dev_dyn00(tornado.web.RequestHandler):
	#~ limit 请求：返回limit记录
	#~ zaddr, id, datDict{light:Integer}, limit 请求：添加记录，返回limit记录
	def get(self):
		req = self.request.arguments.copy()
		req_limit = int(req.pop('limit')[0])
		#~ 
		with orm.db_session:
			if req.has_key('zaddr') and req.has_key('id'):
				#~ 添加记录
				InitValue = {}
				InitValue['zaddr'] = int(req.pop('zaddr')[0])
				InitValue['did'] = int(req.pop('id')[0])
				for k in req:
					if k=='light':
						InitValue[k] = int(req[k][0])
				db.DevDyn00(**InitValue)
				db.commit()
		with orm.db_session:
			res = []
			devs = db.DevDyn00.select().order_by(db.desc(db.DevDyn00.time))[:req_limit]
			for dev in devs:
				d = {}
				d['zaddr'] = dev.zaddr
				d['id'] = dev.did
				d['time'] = convertDatetime(dev.time)
				d['light'] = dev.light
				res.append(d)
		self.write(json.dumps(res))
	
	def post(self):
		self.get()

class dev_dyn01(tornado.web.RequestHandler):
	#~ limit 请求：返回limit记录
	def get(self):
		req = self.request.arguments.copy()
		req_limit = int(req.pop('limit')[0])
		#~ 
		with orm.db_session:
			if req.has_key('zaddr') and req.has_key('id'):
				#~ 添加记录
				InitValue = {}
				InitValue['zaddr'] = int(req.pop('zaddr')[0])
				InitValue['did'] = int(req.pop('id')[0])
				for k in req:
					if k=='light':
						InitValue[k] = int(req[k][0])
				db.DevDyn01(**InitValue)
				db.commit()
		with orm.db_session:
			res = []
			devs = db.DevDyn01.select().order_by(db.desc(db.DevDyn01.time))[:req_limit]
			for dev in devs:
				d = {}
				d['zaddr'] = dev.zaddr
				d['id'] = dev.did
				d['time'] = convertDatetime(dev.time)
				d['light'] = dev.light
				res.append(d)
		self.write(json.dumps(res))
	
	def post(self):
		self.get()
