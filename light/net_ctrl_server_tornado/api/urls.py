
import application
import api.views

handlers = [
(r"/sys_info",api.views.sys_info),
(r"/group_online",api.views.group_online),]

application.app.add_handlers(r"/api",handlers)

print handlers
