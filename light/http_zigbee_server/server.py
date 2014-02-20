
# -*- coding:utf-8 -*-

import tornado.ioloop
import tornado.web
import tornado.httpserver
import tornado.options as opts
import tornado.log as log
import tornado.iostream

import os
import sys

#~ 安装路径
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))

sys.path.append(LOCAL_DIR)

#~ 默认启动参数
opts.define("net_ListenPort",default=8000,type=int,help='指定网络监听端口号')
opts.define("local_MsgLisPort",default=10000,type=int,help='本地信息监听端口号')
opts.define("local_MsgSenPort",default=[20000],type=list,help='本地信息发送端口号')
opts.define("bridge_SenPort",default=7777,type=int)
opts.define("database_host",default='localhost')
opts.define("database_port",default=3306,type=int)
opts.define("database_user",default='root')
opts.define("database_passwd",default='2013')
opts.define("database_db",default='light')

def parse_options():
	'''优先级：命令行 > 安装目录/config.py > /etc/light/net_server.py'''
	if os.path.exists('/etc/light/net_server.py'):
		opts.parse_config_file('/etc/light/net_server.py')
	if os.path.exists(os.path.join(LOCAL_DIR,'config.py')):
		opts.parse_config_file(os.path.join(LOCAL_DIR,'config.py'))
	opts.parse_command_line()
	print '使用配置'
	for k,i in opts.options.as_dict().items():
		print k,'->',i

def main():
	print '智能照明系统 网络服务器'
	parse_options()
	#~ 初始化导入功能模块
	import HttpServer.http_server
	import message.sender
	import message.receiver
	import zbridge.bridge
	import database.zigbee
	import database.http
	#~ 
	print '服务器启动 [OK]'
	tornado.ioloop.IOLoop.instance().start()

if __name__ == '__main__':
	main()
