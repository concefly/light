# -*- coding:utf-8 -*-

from PyQt4 import QtCore,QtNetwork
SIGNAL = QtCore.SIGNAL

import os
import sys
import getopt
sys.path.append(os.getcwd())

from desc_table import desc_t

def usage():
	print 'cmd <套接字路径>'

def main(argv):
	OutSerPath = os.path.abspath('./process1_in')
	cli = QtNetwork.QLocalSocket()
	print '本地套接字数据发送测试，Ctrl+C 退出'
	print OutSerPath
	while True:
		try:
			ss = raw_input('请输入要发送的字符串: ')
			if len(ss)==0:
				print '* 字符串不能为空'
				continue
			cli.connectToServer(OutSerPath)
			if not cli.waitForConnected(-1):
				print '等待连接失败'
				break
			cli.write( ss )
			if not cli.waitForBytesWritten(-1):
				print '数据写出失败'
				break
			cli.disconnectFromServer()
			#~ if not cli.waitForDisconnected(-1):
				#~ print '等待断开出错'
				#~ break
		except KeyboardInterrupt:
			print '用户终止测试'
			break
	print '关闭套接字'
	cli.abort()
	sys.exit(0)
	
if __name__ == '__main__':
	main(sys.argv)
