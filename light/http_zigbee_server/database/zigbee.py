
# -*- coding:utf-8 -*-

import tornado.options as opts
import tornado.log

import db_access as db

import zbridge.bridge

class EventHandlerBasic:
	@staticmethod
	def fiter_attr(d):
		re = {}
		re.update(d)
		re.pop('zaddr',None)
		re.pop('did',None)
		re.pop('e',None)
		return re
	
	@staticmethod
	def reserve_keys(d,*ks):
		re = {}
		for k in ks:
			a = d.get(k,None)
			if a: re[k] = a
		return re
	
	def on_o(self,desc):
		tornado.log.gen_log.info('未实现的数据库操作（o事件，%s） ',desc)
	def on_r(self,desc):
		tornado.log.gen_log.info('未实现的数据库操作（r事件，%s） ',desc)
	def on_td_trr(self,desc):
		tornado.log.gen_log.info('未实现的数据库操作（td或trr事件，%s） ',desc)
	def on_tr(self,desc):
		tornado.log.gen_log.info('未实现的数据库操作（tr事件，%s） ',desc)
	def on_q(self,desc):
		tornado.log.gen_log.info('未实现的数据库操作（q事件，%s） ',desc)
	def on_l(self,desc):
		tornado.log.gen_log.info('未实现的数据库操作（l事件，%s） ',desc)

class EventHandler(EventHandlerBasic):
	def on_o(self,desc):
		init = {}
		init['zaddr'] = desc['zaddr']
		init['ChipCode'] = desc['co']
		init['DevCount'] = desc['dc']
		with db.db_session:
			db.GroupOnline(**init)
			db.commit()
		tornado.log.gen_log.info('写入数据库（控制群 z%s c%s d%s 上线） ' %(init['zaddr'],init['ChipCode'],init['DevCount']))
	
	def on_r(self,desc):
		init = {}
		init['zaddr'] = desc['zaddr']
		init['did'] = desc['did']
		init['MajorNum'] = desc['ma']
		init['SubNum'] = desc['su']
		with db.db_session:
			db.DevOnline(**init)
			db.commit()
		tornado.log.gen_log.info('写入数据库（设备 z%s d%s m%s s%s 注册） ' %(init['zaddr'],init['did'],init['MajorNum'],init['SubNum']))
	
	def on_td_trr(self,desc):
		#~ 设备属性设置
		zaddr = desc['zaddr']
		did = desc['did']
		ma = None
		su = None
		with db.db_session:
			dev = db.DevOnline.get(zaddr=zaddr, did=did)
			ma = dev.MajorNum
			su = dev.SubNum
		init = {}
		init['zaddr'] = zaddr
		init['did'] = did
		with db.db_session:
			DynDb = getattr(db,'DevDyn%s%s' %(ma,su))
			if (ma,su) in [(0,0),(0,1)]:
				init.update(self.reserve_keys(desc,'light'))
				DynDb(**init)
			db.commit()
		tornado.log.gen_log.info('写入数据库（%s事件，%s） ',desc['e'],init)
	
	def on_q(self,desc):
		zaddr = desc['zaddr']
		did = desc['did']
		with db.db_session:
			db.DevOnline.get(zaddr=zaddr, did=did).delete()
			db.commit()
		tornado.log.gen_log.info('写入数据库（设备 z%s d%s 退出） ',zaddr,did)
	
	def on_l(self,desc):
		zaddr = desc['zaddr']
		with db.db_session:
			db.GroupOnline.get(zaddr=zaddr).delete()
			db.commit()
		tornado.log.gen_log.info('写入数据库（控制群 z%s 下线） ',zaddr)

#~ 全局实例
handler = EventHandler()

zbridge.bridge.add_listener('o',handler.on_o)
zbridge.bridge.add_listener('r',handler.on_r)
zbridge.bridge.add_listener('td',handler.on_td_trr)
zbridge.bridge.add_listener('trr',handler.on_td_trr)
zbridge.bridge.add_listener('tr',handler.on_tr)
zbridge.bridge.add_listener('q',handler.on_q)
zbridge.bridge.add_listener('l',handler.on_l)
