# -*- coding:utf-8 -*-

import sqlobject as sqlo

def zaddrCol():
	return sqlo.IntCol(dbName='zaddr',alternateID=True)

def didCol():
	return sqlo.IntCol(dbName='did')

def ChipCodeCol():
	return sqlo.StringCol(dbName='ChipCode',length=255,notNone=True,unique=True)

def nameCol():
	return sqlo.StringCol(dbName='name',length=255)

def descCol():
	return sqlo.StringCol(dbName='`describe`')

def lightCol(t):
	if t=='bool':
		return sqlo.BoolCol(dbName='light')
	else:
		return sqlo.IntCol(dbName='light')

class GroupOnline(sqlo.SQLObject):
	zaddr = zaddrCol()
	ChipCode = ChipCodeCol()
	DevCount = sqlo.IntCol(dbName='DevCount')
	time = sqlo.TimestampCol(dbName='time')

class GroupFixInfo(sqlo.SQLObject):
	zaddr = zaddrCol()
	name = nameCol()
	describe = descCol()

class GroupVarInfo(sqlo.SQLObject):
	zaddr = zaddrCol()
	name = nameCol()
	describe = descCol()

class WhiteList(sqlo.SQLObject):
	ChipCode = ChipCodeCol()

class DevOnline(sqlo.SQLObject):
	zaddr = zaddrCol()
	did = didCol()
	MajorNum = sqlo.IntCol(dbName='MajorNum')
	SubNum = sqlo.IntCol(dbName='SubNum')

class DevFixInfo(sqlo.SQLObject):
	zaddr = zaddrCol()
	did = didCol()
	name = nameCol()
	describe = descCol()
	
class DevVarInfo(sqlo.SQLObject):
	zaddr = zaddrCol()
	did = didCol()
	name = nameCol()
	describe = descCol()

class DevDyn00(sqlo.SQLObject):
	time = sqlo.TimestampCol(dbName='time')
	zaddr = sqlo.IntCol(dbName='zaddr')
	did = sqlo.IntCol(dbName='did')
	light = lightCol('bool')

class DevDyn01(sqlo.SQLObject):
	time = sqlo.TimestampCol(dbName='time')
	zaddr = sqlo.IntCol(dbName='zaddr')
	did = sqlo.IntCol(dbName='did')
	light = lightCol('int')

def createDB(*a):
	setURI(*a)
	GroupOnline.createTable(ifNotExists=True)
	GroupFixInfo.createTable(ifNotExists=True)
	GroupVarInfo.createTable(ifNotExists=True)
	WhiteList.createTable(ifNotExists=True)
	DevOnline.createTable(ifNotExists=True)
	DevFixInfo.createTable(ifNotExists=True)
	DevVarInfo.createTable(ifNotExists=True)
	DevDyn00.createTable(ifNotExists=True)
	DevDyn01.createTable(ifNotExists=True)

def setURI(host='localhost',port='3306',db='light',user='root',passwd='2013'):
	mysqluri = 'mysql://%s:%s@%s:%s/%s' %(user,passwd,host,port,db)
	sqlo.sqlhub.processConnection = sqlo.connectionForURI(mysqluri)
