# -*- coding:utf-8 -*-

class DescError(Exception):
	def __init__(self):
		Exception.__init__(self)
		
	def __str__(self):
		return '描述表解析错误'
		
class DescSyntaxError(DescError):
	def __init__(self,msg):
		DescError.__init__(self)
		self.msg = msg
		
	def __str__(self):
		return '描述表语法错误: '+self.msg

class desc_t(dict):
	def load(self,s):
		self.clear()
		sections = s.strip(' ').rstrip(';').split(';')
		if not sections:
			raise DescSyntaxError('missing ";"')
		for i,line in enumerate(sections):
			kw = line.split(':')
			if len(kw) != 2:
				raise DescSyntaxError('单元%s 冒号个数出错: %s' %(i,line) )
			k = kw[0].strip(' ')
			w = kw[1].strip(' ')
			try:
				w = int(w,16) if w[:2] in ('0x','0X') else w
			except:
				raise DescSyntaxError('二进制值解析出错 %s' %(line,))
			self[k] = w
			
		return self.__len__()
	
	def __str__(self):
		return ''.join([ str(k)+':'+(hex(w) if type(w)==int else str(w))+';' for k,w in self.items() ])

if __name__ == "__main__":
	d = desc_t(a=16)
	#~ d = desc_t()
	#~ print d.load("A:123;B:555;  C:0; D:0x3d;")
	print d
