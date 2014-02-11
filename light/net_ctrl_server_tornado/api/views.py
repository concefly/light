# -*- coding:utf-8 -*-

import tornado.web

import json
import datetime
import db_access as db

def jsonResponse(state=200,message='ok',response=[]):
	d = {}
	d['state'] = state
	d['message'] = message
	d['response'] = response
	return json.dumps(response)

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
	
	def post(self):
		self.get()

class group_dev_tree(tornado.web.RequestHandler):
	def get(self):
		res = dict(label='group', type='root', kids=[])
		for group in  db.GroupOnline.select():
			g = {}
			g['zaddr'] = group.zaddr
			g['type'] = 'group'
			g['ChipCode'] = group.ChipCode
			g['DevCount'] = group.DevCount
			g['time'] = convertDatetime(group.time)
			g['label'] = '%s %s devs @%s %s' %(g['ChipCode'],g['zaddr'],g['DevCount'],group.time.strftime('%Y-%m-%d %H:%M:%S'))
			g['kids'] = []
			for dev in db.DevOnline.selectBy(zaddr=g['zaddr']):
				d = {}
				d['type'] = 'device'
				d['zaddr'] = g['zaddr']
				d['id'] = dev.did
				d['MajorNum'] = dev.MajorNum
				d['SubNum'] = dev.SubNum
				d['label'] = '%s (%s,%s)' %(d['id'],d['MajorNum'],d['SubNum'])
				g['kids'].append(d)
			if not g['kids']:
				del g['kids']
			res['kids'].append( g )
		self.write(jsonResponse(response=res))

class group_fix_info(tornado.web.RequestHandler):
	def get(self):
		req_zaddr = int( self.get_argument('zaddr') )
		res = []
		groups = db.GroupFixInfo.selectBy(zaddr=req_zaddr)
		if len(list(groups))==0:
			group = db.GroupFixInfo(zaddr=req_zaddr, name='No name', describe='No describe')
		else:
			group = groups[0]
		res.append(dict(item='name',content=group.name))
		res.append(dict(item='describe',content=group.describe))
		self.write( jsonResponse(response=res) )
	
	def post(self):
		self.get()

class group_var_info(tornado.web.RequestHandler):
	def get(self):
		req = self.request.arguments.copy()
		zaddr = int(req['zaddr'][0])
		groups = db.GroupVarInfo.selectBy(zaddr=zaddr)
		#~ 若不存在此条目，新增它
		if len(list(groups))==0:
			group = db.GroupVarInfo(zaddr=zaddr,name = 'No name',describe = 'No describe')
		else:
			group = groups[0]
		res = []
		if len(req) >= 2:
			#~ 修改属性
			req.pop('zaddr')
			for key in req:
				if(key=='name'):
					group.name = req['name'][0]
				elif(key=='describe'):
					group.describe = req['describe'][0]
		#~ 获取属性
		res.append(dict(item='name',content=group.name))
		res.append(dict(item='describe',content=group.describe))
		self.write( jsonResponse(response=res) )
	
	def post(self):
		self.get()

class dev_fix_info(tornado.web.RequestHandler):
	def get(self):
		req_zaddr = int( self.get_argument('zaddr') )
		req_id = int( self.get_argument('id') )
		res = []
		devs = db.DevFixInfo.selectBy(zaddr=req_zaddr, did=req_id)
		if len(list(devs))==0:
			dev = db.DevFixInfo(zaddr=req_zaddr, did=req_id, name='No name', describe='No describe')
		else:
			dev = devs[0]
		res.append(dict(item='name',content=dev.name))
		res.append(dict(item='describe',content=dev.describe))
		self.write( jsonResponse(response=res) )
	
	def post(self):
		self.get()

class dev_var_info(tornado.web.RequestHandler):
	def get(self):
		req = self.request.arguments.copy()
		req_zaddr = int(req['zaddr'][0])
		req_id = int(req['id'][0])
		devs = db.DevVarInfo.selectBy(zaddr=req_zaddr, did=req_id)
		#~ 若不存在此条目，新增它
		if len(list(devs))==0:
			dev = db.DevVarInfo(zaddr=req_zaddr, did=req_id, name = 'No name',describe = 'No describe')
		else:
			dev = devs[0]
		res = []
		if len(req) >= 2:
			#~ 修改属性
			req.pop('zaddr')
			for key in req:
				if(key=='name'):
					dev.name = req['name'][0]
				elif(key=='describe'):
					dev.describe = req['describe'][0]
		#~ 获取属性
		res.append(dict(item='name',content=dev.name))
		res.append(dict(item='describe',content=dev.describe))
		self.write( jsonResponse(response=res) )
	
	def post(self):
		self.get()

class dev_dyn00(tornado.web.RequestHandler):
	def get(self):
		req = self.request.arguments.copy()
		req_zaddr = int(req['zaddr'][0])
		req_id = int(req['id'][0])
		req_limit = int(req['limit'][0])
		devs = db.DevDyn00.selectBy(zaddr=req_zaddr, did=req_id)
		res = []
		devs_len = len(list(devs))
		if devs_len > req_limit:
			devs = devs[:req_limit]
		for dev in devs:
			res.append(dict(time=convertDatetime(dev.time), light=dev.light))
		self.write( jsonResponse(response=res) )
	
	def post(self):
		self.get()

class dev_dyn(tornado.web.RequestHandler):
	def get(self):
		req = self.request.arguments.copy()
		req_zaddr = int(req['zaddr'][0])
		req_id = int(req['id'][0])
		req_limit = int(req['limit'][0])
		devs = db.DevOnline.selectBy(zaddr=req_zaddr, did=req_id)
		res = []
		if len(list(devs)) > 0:
			dev = devs[0]
			mn = dev.MajorNum
			sn = dev.SubNum
			if mn==0 and sn==0:
				#~ 设备号 00
				dev00s = db.DevDyn00.selectBy(zaddr=req_zaddr, did=req_id)
				dev00s = dev00s[:req_limit] if len(list(dev00s)) > req_limit else dev00s
				for dev00 in dev00s:
					d = {}
					d['time'] = convertDatetime(dev00.time)
					d['light'] = dev00.light
					d['label'] = 'time:%s,    light:%s' %(dev00.time.strftime('%Y-%m-%d %H:%M:%S'),d['light'])
					res.append(d)
			elif mn==0 and sn==1:
				#~ 设备号 01
				dev01s = db.DevDyn01.selectBy(zaddr=req_zaddr, did=req_id)
				dev01s = dev01s[:req_limit] if len(list(dev01s)) > req_limit else dev01s
				for dev01 in dev01s:
					d = {}
					d['time'] = convertDatetime(dev01.time)
					d['light'] = dev01.light
					d['label'] = 'time:%s,    light:%s' %(dev01.time.strftime('%Y-%m-%d %H:%M:%S'),d['light'])
					res.append(d)
		self.write( jsonResponse(response=res) )
	
	def post(self):
		self.get()
