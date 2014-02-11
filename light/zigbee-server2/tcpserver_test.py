# -*- coding:utf-8 -*-

import tornado.tcpserver
import tornado.ioloop

class handler(object):
	hlist = set()
	def __init__(self,stream,addr):
		handler.hlist.add(self)
		self.stream = stream
		self.addr = addr
		self.stream.read_until('0',self.on_read)
		self.stream.set_close_callback(self.on_close)
	
	def on_read(self,dat):
		print self.addr,'发来信息',dat
	
	def on_close(self):
		print '关闭连接',self.addr
		handler.hlist.remove(self)

class server(tornado.tcpserver.TCPServer):
	def handle_stream(self,stream,address):
		print '接收到新连接',stream,address
		handler(stream,address)

ser = server()
ser.listen(10000)
tornado.ioloop.IOLoop.instance().start()
