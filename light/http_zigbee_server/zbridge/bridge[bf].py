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

#~ 接收的事件的回调函数
#~ 回调函数 store
#~ 回调函数是一次性的，回调即清除
class CallbackStore_basic:
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

class CallbackStore_send:
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

#~ 全局方法
def send(desc,on_y=None,on_n=None,on_trr=None):
	'数据直接下发'
	global stream
	store = CallbackStore_send
	#~ 装入回调store
	e = desc['e']
	if e in ('td','tr'):
		zaddr = desc['zaddr']
		did = desc['did']
		if on_y: store.add('y',zaddr,did,on_y)
		if on_n: store.add('n',zaddr,did,on_n)
		if on_trr: store.add('trr',zaddr,did,on_trr)
	tornado.log.gen_log.info('bridge 指令下发 %s' %(desc,))
	stream.write(str(desc))
	
def _on_basic_standard(event,desc=None):
	global CallbackStore
	fs = [] + getattr(CallbackStore,'on_'+event)
	getattr(CallbackStore,'on_'+event) = []
	while len(fs):
		if desc: fs.pop(0)(desc)
		else: fs.pop(0)()

def _on_connect():
	' stream连接事件 '
	global stream
	stream.read_until('$$$',_on_stream_read)
	stream.set_close_callback(_on_close)
	tornado.log.gen_log.info('bridge 连接成功')
	_on_basic_standard('connect')

def _on_close():
	global stream
	tornado.log.gen_log.warn('bridge 连接断开')
	_on_basic_standard('close')
	tornado.log.gen_log.warn('bridge 尝试重连')
	stream = tornado.iostream.IOStream( socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0) )
	stream.connect(('localhost',opts.options.bridge_SenPort),_on_connect)

def _on_o(desc):
	_on_basic_standard('o',desc)

def _on_r(desc):
	_on_basic_standard('r',desc)

def _on_td(desc):
	_on_basic_standard('td',desc)

def _on_tr(desc):
	_on_basic_standard('tr',desc)

def _on_q(desc):
	_on_basic_standard('q',desc)

def _on_l(desc):
	_on_basic_standard('l',desc)

def _on_basic_send(event,desc):
	zaddr = desc['zaddr']
	did = desc['did']
	store = CallbackStore_send()
	fs = [] + getattr(store,'on_'+event)[(zaddr,did)]
	getattr(store,'on_'+event)[(zaddr,did)] = []
	while len(fs):
		if desc: fs.pop(0)(desc)
		else: fs.pop(0)()

def _on_y(desc):
	_on_basic_send('y',desc)

def _on_n(desc):
	_on_basic_send('n',desc)

def _on_trr(desc):
	_on_basic_standard('trr',desc)
	_on_basic_send('trr',desc)

def _on_stream_read(rdat):
	tornado.log.gen_log.info('bridge 收到数据 %s' %(rdat,))
	desc = desc_t()
	desc.load(rdat.rstrip('$$$'))
	e = desc['e']
	if e=='o': _on_o(desc)
	elif e=='r': _on_r(desc)
	elif e=='td': _on_td(desc)
	elif e=='tr': _on_tr(desc)
	elif e=='trr': _on_trr(desc)
	elif e=='q': _on_q(desc)
	elif e=='l': _on_l(desc)
	elif e=='y': _on_y(desc)
	elif e=='n': _on_n(desc)
	stream.read_until('$$$',_on_stream_read)

#~ 全局实例
CallbackStore = CallbackStore_basic()
stream = tornado.iostream.IOStream( socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0) )
stream.connect(('localhost',opts.options.bridge_SenPort),_on_connect)

