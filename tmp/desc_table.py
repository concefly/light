# -*- coding:utf-8 -*-

class DescError(Exception):
	def __init__(self):
		Exception.__init__(self)
		
	def __str__(self):
		return '描述表解析错误'
		
class DescSyntaxError(DescError):
	def __init__(self,*args):
		DescError.__init__(self)
		self.msg = ' '.join( [str(i) for i in args] )
		
	def __str__(self):
		return '描述表语法错误: '+self.msg

class desc_t(dict):
	def load(self,s):
		self.clear()
		sections = s.strip(';').split(';')
		if not sections:
			raise DescSyntaxError('missing ";"')
		for i,line in enumerate(sections):
			kw = line.split(':')
			if len(kw) != 2:
				raise DescSyntaxError('单元中冒号个数出错','#',i,line)
			k = kw[0].strip(' ')
			w = kw[1].strip(' ')
			try:
				w = int(w,16) if w[:2] in ('0x','0X') else w
			except:
				raise DescSyntaxError('二进制值解析出错','#',i,line)
			self[k] = w
			
		return self.__len__()
	
	def __str__(self):
		return ''.join([ str(k)+':'+str(w)+';' for k,w in self.items() ])

if __name__ == "__main__":
	d = desc_t()
	print d.load("A:123;B:555;  C:0; D:0x3d;")
	print d
