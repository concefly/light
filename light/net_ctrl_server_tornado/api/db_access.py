# -*- coding:utf-8 -*-

from datetime import datetime
from pony.orm import *

db = Database("mysql", host="localhost", port=3306, user="root", passwd="2013", db="light", charset="utf8")

class GroupOnline(db.Entity):
    zaddr = PrimaryKey(int)
    ChipCode = Required(str)
    DevCount = Required(int)
    time = Required(datetime, sql_type="timestamp")

class GroupFixInfo(db.Entity):
    zaddr = PrimaryKey(int)
    name = Optional(str)
    describe = Optional(LongStr)

class GroupVarInfo(db.Entity):
    zaddr = PrimaryKey(int)
    name = Optional(str)
    describe = Optional(LongStr)

class DevOnline(db.Entity):
    zaddr = Required(int)
    did = Required(int)
    MajorNum = Required(int)
    SubNum = Required(int)
    time = Optional(datetime, sql_type="timestamp")
    PrimaryKey(zaddr, did)

class DevFixInfo(db.Entity):
    zaddr = Required(int)
    did = Required(int)
    name = Optional(str)
    describe = Optional(LongStr)
    PrimaryKey(zaddr, did)

class DevVarInfo(db.Entity):
    zaddr = Required(int)
    did = Required(int)
    name = Optional(str)
    describe = Optional(LongStr)
    PrimaryKey(zaddr, did)

class WhiteList(db.Entity):
    ChipCode = PrimaryKey(str)

class DevDyn00(db.Entity):
    id = PrimaryKey(int, auto=True)
    time = Optional(datetime, sql_type="timestamp")
    zaddr = Required(int)
    did = Required(int)
    light = Required(bool)

class DevDyn01(db.Entity):
    id = PrimaryKey(int, auto=True)
    time = Optional(datetime, sql_type="timestamp")
    zaddr = Required(int)
    did = Required(int)
    light = Required(int)

#~ sql_debug(True)
db.generate_mapping(create_tables=True)
