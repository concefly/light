# -*- coding:utf-8 -*-

import tornado.ioloop
import tornado.web
import tornado.httpserver
import tornado.options as opts
import tornado.log as log
import tornado.iostream

import socket
import copy

from desc_table import desc_t

class SignalStore:
	#~ stream连接事件
	#~ [ func,... ]
	on_connect = []
	on_close = []
	#~ zigbee事件, y,n,trr 事件在send函数中回调
	#~ [ func,... ]
	on_o = []	# 控制群上线
	on_r = []	# 设备注册
	on_td = []	# 直接消息
	on_tr = []	# 请求
	on_trr = []	# trr 事件在 basic & send 中都有定义
	on_q = []	# 设备退出
	on_l = []	# 控制群下线
	@classmethod
	def add(cls,event,callback):
		store = getattr(cls,'on_'+event)
		if not callback in store:
			store.append(callback)
	@classmethod
	def remove(cls,event,callback):
		store = getattr(cls,'on_'+event)
		if callback in store:
			store.pop( store.index(callback) )

class SendCallbackStore:
	#~ 特殊处理
	#~ { (zaddr,did):[func,...] }
	on_y = {}
	on_n = {}
	on_trr = {}
	@classmethod
	def add(cls,event,zaddr,did,callback):
		store = getattr(cls,'on_'+event)
		if store.has_key((zaddr,did)):
			this = store[(zaddr,did)]
			if not callback in this:
				this.append(callback)
		else:
			store[(zaddr,did)] = [callback]
 	@classmethod
	def remove(cls,event,zaddr,did,callback):
		store = getattr(cls,'on_'+event)
		if store.has_key((zaddr,did)):
			this = store[(zaddr,did)]
			if callback in this:
				this.pop( this.index(callback) )

class SignalHandler:
	def on_basic(self,event,desc=None):
		fs = [] + getattr(SignalStore,'on_'+event)
		while len(fs):
			if desc: fs.pop(0)(desc)
			else: fs.pop(0)()
	
	def on_close(self):
		self.on_basic('close')
	
	def on_connect(self):
		self.on_basic('connect')
	
	def on_o(self,desc):
		self.on_basic('o',desc)

	def on_r(self,desc):
		self.on_basic('r',desc)

	def on_td(self,desc):
		self.on_basic('td',desc)

	def on_tr(self,desc):
		self.on_basic('tr',desc)
	
	def on_trr(self,desc):
		self.on_basic('trr',desc)
	
	def on_q(self,desc):
		self.on_basic('q',desc)

	def on_l(self,desc):
		self.on_basic('l',desc)
	
class SendCallbackHandler:
	def on_basic_send(self,event,desc):
		zaddr = desc['zaddr']
		did = desc['did']
		fs = [] + getattr(SendCallbackStore,'on_'+event)[(zaddr,did)]
		getattr(store,'on_'+event)[(zaddr,did)] = []
		while len(fs):
			if desc: fs.pop(0)(desc)
			else: fs.pop(0)()
	
	def on_y(self,desc):
		self.on_basic_send('y',desc)

	def on_n(self,desc):
		self.on_basic_send('n',desc)

	def on_trr(self,desc):
		self.on_basic_send('trr',desc)

class StreamHandler:
	EndStr = '$$$'
	def __init__(self):
		#~ 
		self.SignalHandler = SignalHandler()
		self.SendCallbackHandler = SendCallbackHandler()
		#~ 
		self.connect()
	
	def connect(self):
		self.stream = tornado.iostream.IOStream( socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0) )
		self.stream.connect(('localhost',opts.options.bridge_SenPort),self.on_connect)
	
	def on_connect(self):
		self.stream.read_until(StreamHandler.EndStr,self.on_stream_read)
		self.stream.set_close_callback(self.on_close)
		tornado.log.gen_log.info('bridge 连接成功')
		self.SignalHandler.on_connect()
	
	def on_close(self):
		tornado.log.gen_log.warn('bridge 连接断开')
		self.SignalHandler.on_close()
		tornado.log.gen_log.warn('bridge 尝试重连')
		self.connect()
	
	def on_stream_read(self,rdat):
		tornado.log.gen_log.info('bridge 收到数据 %s' %(rdat,))
		desc = desc_t()
		desc.load(rdat.rstrip(StreamHandler.EndStr))
		e = desc['e']
		if e=='o': self.SignalHandler.on_o(desc)
		elif e=='r': self.SignalHandler.on_r(desc)
		elif e=='td': self.SignalHandler.on_td(desc)
		elif e=='tr': self.SignalHandler.on_tr(desc)
		elif e=='trr': self.SignalHandler.on_trr(desc)
		elif e=='q': self.SignalHandler.on_q(desc)
		elif e=='l': self.SignalHandler.on_l(desc)
		elif e=='y': self.SignalHandler.on_y(desc)
		elif e=='n': self.SignalHandler.on_n(desc)
		#~ 
		self.stream.read_until(StreamHandler.EndStr,self.on_stream_read)
	
	def send(self,desc,on_y=None,on_n=None,on_trr=None):
		'数据直接下发'
		store = SendCallbackStore
		#~ 装入 send callback store
		e = desc['e']
		if e in ('td','tr'):
			zaddr = desc['zaddr']
			did = desc['did']
			if on_y: store.add('y',zaddr,did,on_y)
			if on_n: store.add('n',zaddr,did,on_n)
			if on_trr: store.add('trr',zaddr,did,on_trr)
		tornado.log.gen_log.warn('bridge 尝试下载指令 %s' %(desc,))
		self.stream.write(str(desc), lambda : tornado.log.gen_log.info('bridge 下载[OK] %s' %(desc,)))

#~ 全局方法
def add_listener(event,callback):
	SignalStore.add(event,callback)

def remove_listener(event,callback):
	SignalStore.remove(event,callback)

stream = StreamHandler()

def send(desc,on_y=None,on_n=None,on_trr=None):
	stream.send(desc, on_y=on_y, on_n=on_n, on_trr=on_trr)
