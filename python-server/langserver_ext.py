import json
import logging
import re
import subprocess
import threading

import os

import tornado
from tornado import ioloop, process, web, websocket

from pyls_jsonrpc import streams

log = logging.getLogger(__name__)


class LanguageServerWebSocketHandler(tornado.websocket.WebSocketHandler):
    """Setup tornado websocket handler to host an external language server."""

    writer = None

    def open(self, *args, **kwargs):
        log.info("Spawning pyls subprocess")

        # Create an instance of the language server
        proc = process.Subprocess(
            ['pyls', '-v'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE
        )

        # Create a writer that formats json messages with the correct LSP headers
        self.writer = streams.JsonRpcStreamWriter(proc.stdin)

        # Create a reader for consuming stdout of the language server. We need to
        # consume this in another thread
        def consume():
            # Start a tornado IOLoop for reading/writing to the process in this thread
            ioloop.IOLoop()
            reader = streams.JsonRpcStreamReader(proc.stdout)
            reader.listen(lambda msg: self.write_message(json.dumps(msg)))

        thread = threading.Thread(target=consume)
        thread.daemon = True
        thread.start()

    def on_message(self, message):
        print("这是接收到的消息！")

        print(message)
        """Forward client->server messages to the endpoint."""
        self.writer.write(json.loads(message))

    def check_origin(self, origin):
        return True


class BaseHandler(tornado.web.RequestHandler):
    def __init__(self, *argc, **argkw):
        super(BaseHandler, self).__init__(*argc, **argkw)

    # 解决跨域问题
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")  # 这个地方可以写域名
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header("Access-Control-Allow-Methods", "PUT,POST, GET, OPTIONS")
        self.set_header("Access-Control-Max-Age", 1000)
        self.set_header("Content-type", "application/json")

    def get(self):
        self.write('request get')

    def post(self):
        self.write('request post')

    # vue一般需要访问options方法， 如果报错则很难继续，所以只要通过就行了，当然需要其他逻辑就自己控制。
    def options(self):
        # 返回方法1
        self.set_status(204)
        self.finish()
        # 返回方法2
        self.write('{"errorCode":"00","errorMessage","success"}')


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("You requested the main page")


class StoryHandler(tornado.web.RequestHandler):
    def get(self, story_id):
        self.write("You requested the story " + story_id)


class FileHandler(BaseHandler):

    # 新建文件
    def post(self):
        path = './usercode/'
        if os.path.exists('./usercode/' + 'zjl.py'):
            self.write("该文件已经存在,请重新")
        else:
            open(path + self+'.py', 'w+')


class PythonHandler(BaseHandler):
    # 回显code
    def get(self):
        f = open("test.py", encoding='utf-8')
        lines = f.readlines()
        str = ""
        for line in lines:
            str += line
        f.close()
        self.write(str)

    # 保存code
    def post(self):
        f = open('test.py', 'w+')
        # os.linesep代表当前操作系统上的换行符
        post_data = self.request.body.decode('utf-8')
        f.writelines(post_data)
        self.write("success")

    def put(self):
        f = open('test.py', 'w+')
        # os.linesep代表当前操作系统上的换行符
        post_data = self.request.body.decode('utf-8')
        f.writelines(post_data)

        f = os.popen("test.py", 'r')
        res = f.readlines()  # res接受返回结果
        str = ""
        for line in res:
            str += line
        f.close()
        self.write(str)


if __name__ == "__main__":
    app = web.Application([
        (r"/python", LanguageServerWebSocketHandler),
        (r"/story/([0-9]+)", StoryHandler),
        (r"/code/", PythonHandler),
        (r"/createFile", FileHandler)
    ])
    app.listen(3001)
    ioloop.IOLoop.current().start()
