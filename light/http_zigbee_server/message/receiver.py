# -*- coding:utf-8 -*-

import tornado.tcpserver
import tornado.log as log
import tornado.options as opts

import json

#~ 回调函数 store
#~ 回调函数是一次性的，回调即清除
class CallbackStore:
	on_changeGroupOnline = []
	on_changeGroupFixInfo = []
	on_changeGroupVarInfo = []
	on_changeWhiteList = []
	on_changeDevOnline = []
	on_changeDevFixInfo = []
	on_changeDevVarInfo = []
	on_changeDevDyn00 = []
	on_changeDevDyn01 = []
	
	@staticmethod
	def add(cls,msg,callback):
		store = getattr(cls,'on_'+msg)
		if not callback in store:
			store.append(callback)
	
	@staticmethod
	def remove(cls,msg,callback):
		store = getattr(cls,'on_'+msg)
		if callback in store:
			store.pop( store.index(callback) )
	
class client_handler:
	client = set()
	EndStr = '\n'
	def __init__(self,stream,addr):
		client_handler.client.add(self)
		self.stream = stream
		self.addr = addr
		self.callback_read()
		self.stream.set_close_callback(self.on_close)
	
	def callback_read(self):
		'''设置读取戳'''
		self.stream.read_until(client_handler.EndStr,self.on_read)
	
	def on_read(self,rdat):
		'''
		JSON 格式消息
		[{msg:,...}...]
		'''
		global CallbackStore
		MsgList = json.loads(rdat.rstrip(client_handler.EndStr))
		log.gen_log.info('收到消息，来自%s： %s' %(self.addr[0],MsgList) )
		#~ 遍历收到的消息
		for msg in MsgList:
			msg_str = msg['msg']
			fs = getattr(CallbackStore,'on_'+msg_str)
			while len(fs):
				fs.pop(0)(msg)
		self.callback_read()
	
	def on_close(self):
		client_handler.client.remove(self)
		log.gen_log.info('message 连接断开 %s' %(self.addr[1],) )

class server(tornado.tcpserver.TCPServer):
	def handle_stream(self,stream,addr):
		log.gen_log.info('message 新连接进入 %s' %(addr[1],))
		client_handler(stream,addr);

#~ 全局实例
CallbackStore = CallbackStore()
receiver = server()
receiver.listen(opts.options.local_MsgLisPort)
