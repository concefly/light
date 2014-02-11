# -*- coding:utf-8 -*-

import tornado.tcpserver
import tornado.ioloop
import tornado.options as topts
import tornado.log
import tornado.iostream

import sys
import os
sys.path.append(os.getcwd())
from desc_table import desc_t

import MySQLdb
import socket
import logging
import StringIO
import traceback

#~ 默认启动参数
topts.define("root",default='../../',help='指定根路径')
topts.define("config",default='/etc/light/zigbee-server.py',help='指定配置文件路径')
topts.define("net_ListenPort",default=10001,type=int)
topts.define("net_ConnectPort",default=[20000,20001],type=list)
topts.define("database_host",default='localhost')
topts.define("database_port",default=3306,type=int)
topts.define("database_user",default='root')
topts.define("database_passwd",default='2013')
topts.define("database_name",default='light')

def main():
	#~ 准备启动参数
	topts.parse_command_line()
	topts.options.root = os.path.abspath(topts.options.root)
	topts.options.config = os.path.join(topts.options.root,topts.options.config.strip('/'))
	topts.parse_config_file(topts.options.config)
	#~ 启动日志
	#~ 打印配置
	print '使用配置'
	for k,i in topts.options.as_dict().items():
		print k,'->',i
	#~ 启动TCP服务器
	ser = server()
	ser.listen(topts.options.net_ListenPort)
	tornado.ioloop.IOLoop.instance().start()

class desc_distribute(object):
	ser = set()
	def __init__(self,port,desc):
		desc_distribute.ser.add(self)
		self.desc = desc
		self.port = port
		sock = socket.socket()
		self.stream = tornado.iostream.IOStream(sock)
		self.stream.connect(("localhost", port),self.on_connect)
	
	def on_connect(self):
		self.stream.write(str(self.desc),self.on_write_done)
	
	def on_write_done(self):
		tornado.log.gen_log.info('分发指令 %s 到 %s' %(self.desc,self.port))
		self.stream.close()
		desc_distribute.ser.remove(self)

class server_handler(object):
	client = set()
	def __init__(self,stream,addr):
		server_handler.client.add(self)
		self.stream = stream
		self.addr = addr
		self.callback_read()
		self.stream.set_close_callback(self.on_close)
		#~ 连接数据库
		d = topts.options.as_dict()
		self.conn = MySQLdb.connect(host=d['database_host'],port=d['database_port'],user=d['database_user'],passwd=d['database_passwd'],db=d['database_name'],charset='utf8')
	
	def callback_read(self):
		self.stream.read_until('#',self.on_read)
	
	def on_read(self,dat):
		dat = dat[:-1]
		tornado.log.gen_log.info('收到数据 %s' %(dat,))
		desc = desc_t()
		desc.load(dat)
		redesc = desc_t()
		try:
			cmd = desc.get('ZigbeeServerCmd')
			if cmd:
				#~ 控制指令
				tornado.log.gen_log.info('处理控制指令 %s' %(cmd,))
				redesc.update(getattr(self,'ctrl_'+cmd)(desc))
			else:
				#~ ZLL 指令
				event = desc['e']
				tornado.log.gen_log.info('处理ZLL事件 %s' %(event,))
				redesc.update(getattr(self,'zll_'+event)(desc))
		except Exception as e:
			fp = StringIO.StringIO()
			traceback.print_exc(file=fp)
			tornado.log.gen_log.error('%s 指令执行出错\n %s' %(dat,fp.getvalue()) )
		if len(redesc):
			#~ 下载指令
			tornado.log.gen_log.info('下载指令 %s' %(str(redesc)))
			self.stream.write(str(redesc))
			#~ 分发指令
			if desc.has_key('ZigbeeServerCmd'):
				for p in topts.options.net_ConnectPort:
					desc_distribute(p,redesc)
		self.callback_read()
	
	def on_close(self):
		self.conn.close()
		server_handler.client.remove(self)
		tornado.log.gen_log.info('连接断开 %s' %(self.addr[1]))
	
	def ctrl_get(self,desc):
		re = dict()
		attr = desc['attr'].lower()
		if attr=='pid':
			re['state'] = 'y'
			re['pid'] = os.getpid()
		elif attr=='log':
			re['state'] = 'y'
			re['log'] = topts.options.log_file_prefix
		else:
			re['state'] = 'n'
			re['reason'] = '不支持的属性'
		return re
	
	def ctrl_reconfig(self,desc):
		re = dict(state='n',reason='未完成的指令')
		return re
	
	def zll_o(self,desc):
		#~ 控制群上线
		zaddr = desc['zaddr']
		ChipCode = desc['co']
		DevCount = desc['dc']
		cur = self.conn.cursor()
		cur.execute('select zaddr from group_online where zaddr=%s',(zaddr,))
		if len(cur.fetchall()):
			#~ 记录中存在群
			cur.execute('update group_online set ChipCode=%s,DevCount=%s where zaddr=%s',(ChipCode,DevCount,zaddr))
		else:
			cur.execute('insert into group_online (zaddr,ChipCode,DevCount) values (%s,%s,%s)',(zaddr,ChipCode,DevCount))
		self.conn.commit()
		cur.close()
		return {}
	
	def zll_r(self,desc):
		#~ 设备加入
		zaddr = desc['zaddr']
		idd = desc['id']
		MajorNum = desc['ma']
		SubNum = desc['su']
		cur = self.conn.cursor()
		cur.execute('select zaddr from dev_online where zaddr=%s and id=%s',(zaddr,idd))
		if len(cur.fetchall()):
			#~ 记录中存在设备
			cur.execute('update dev_online set MajorNum=%s,SubNum=%s where zaddr=%s and id=%s',(MajorNum,SubNum,zaddr,idd))
		else:
			cur.execute('insert into dev_online (zaddr,id,MajorNum,SubNum) values (%s,%s,%s,%s)',(zaddr,idd,MajorNum,SubNum))
		self.conn.commit()
		cur.close()
		return {}
	
	def zll_td(self,desc):
		#~ 设备到控制器 直接发送
		zaddr = desc['zaddr']
		idd = desc['id']
		re = dict(zaddr=zaddr,id=idd)
		try:
			cur = self.conn.cursor()
			cur.execute('select MajorNum,SubNum from dev_online where zaddr=%s and id=%s',(zaddr,idd))
			MajorNum,SubNum = cur.fetchone()
			#~ 构造sql语句
			attr = desc.keys()
			attr.pop(attr.index('e'))
			s1 = ','.join(attr)
			s2 = ','.join(['%s']*len(attr))
			sql = 'insert into dev_dyn_%s_%s (%s) values (%s)' %(MajorNum,SubNum,s1,s2)
			#~ 插入数据
			cur.execute(sql,[desc[k] for k in attr])
			self.conn.commit()
		except Exception as e:
			fp = StringIO.StringIO()
			traceback.print_exc(file=fp)
			tornado.log.gen_log.error('td指令 %s 执行出错\n %s' %(desc,fp.getvalue()) )
			re['e'] = 'n'
			re['reason'] = 'db error'
		else:
			re['e'] = 'y'
		return re
	
	def zll_tr(self,desc):
		#~ 设备到控制器 请求
		return dict(zaddr=desc['zaddr'],id=desc['id'],e='n',reason='no_handler')

class server(tornado.tcpserver.TCPServer):	
	def handle_stream(self,stream,addr):
		tornado.log.gen_log.info('新连接进入 %s' %(addr[1],))
		server_handler(stream,addr);
	
if __name__ == '__main__':
	main()

