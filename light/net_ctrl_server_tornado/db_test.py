# -*- coding:utf-8 -*-

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import db_access as db

db.setURI()
while True:
	peers = db.GroupOnline.selectBy()
	print 'peers:',peers
	print list(peers)
	print peers[0].ChipCode
	print '--------'
	raw_input("enter")
