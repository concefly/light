# -*- coding:utf-8 -*-

import tornado.tcpserver
import tornado.log as log
import tornado.options as opts

import json
import socket

class msg_distribute(object):
	ser = set()
	def __init__(self,port,msg):
		'''
		JSON 格式消息
		[{msg:,...}...]
		'''
		msg_distribute.ser.add(self)
		self.msg = msg
		self.port = port
		sock = socket.socket()
		self.stream = tornado.iostream.IOStream(sock)
		self.stream.connect(("localhost", port),self.on_connect)
	
	def on_connect(self):
		self.stream.write(json.dumps(self.msg)+'\n',self.on_write_done)
	
	def on_write_done(self):
		tornado.log.gen_log.info('发送消息 %s 到 %s' %(self.msg,self.port))
		self.stream.close()
		msg_distribute.ser.remove(self)

#~ 全局方法
def send(self,*msgs):
	' {msg:,...}, ... '
	for p in opts.options.local_MsgSenPort:
		msg_distribute(p,msgs)

