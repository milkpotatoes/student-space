# coding=utf-8
from threading import Lock
from base.APIConstants import Constants
import random
import time
from functools import reduce

lock = Lock()


class Singleton(type):
    """
    singleton design
    """

    def __init__(cls, name, bases, kw):
        super(Singleton, cls).__init__(name, bases, kw)
        cls._instance = None

    def __call__(cls, *args, **kw):
        if cls._instance is None:
            cls._instance = super(Singleton, cls).__call__(*args)
        return cls._instance


class Server(object):
    """
    服务model(包含host, 最小权重, 最大权重, 权重速率)
    """

    def __init__(self, host, min_priority, max_priority, decr_step, incr_step):
        self.host = host
        self.priority = max_priority
        self.min_priority = min_priority
        self.max_priority = max_priority
        self.decr_step = decr_step
        self.incr_step = incr_step

    def incr_priority(self):
        self.__change_priority(True, self.incr_step)

    def decr_priority(self):
        self.__change_priority(False, self.decr_step)

    def __change_priority(self, incr, step):
        lock.acquire()
        change_priority = self.priority + step if incr else self.priority - step
        if change_priority < self.min_priority:
            change_priority = self.min_priority
        elif change_priority > self.max_priority:
            change_priority = self.max_priority
        self.priority = change_priority
        lock.release()


class ServerSwitch(object, metaclass=Singleton):
    """
    服务host选举类(单例)
    加权轮询算法
    """

    def __init__(self):
        self.feedback = Server(Constants.host_production_feedback, 100, 100, 0, 0)
        self.sandbox = Server(Constants.host_sandbox, 100, 100, 0, 0)
        self.specified = Server(Constants.host, 100, 100, 0, 0)
        self.emq = Server(Constants.host_emq, 100, 100, 0, 0)
        self.default_server = Server(Constants.host_production, 1, 90, 10, 5)
        self.servers = []
        self.inited = False
        self.last_refresh_time = time.time()

    def need_refresh_host_list(self):
        return not self.inited or (time.time() - self.last_refresh_time) >= Constants.refresh_server_host_interval

    def initialize(self, host_list):
        if not self.need_refresh_host_list():
            return
        vs = host_list.split(',')
        for s in vs:
            sp = s.split(':')
            if len(sp) < 5:
                self.servers.append(self.default_server)
                continue
            self.servers.append(Server(sp[0], int(sp[1]), int(sp[2]), int(sp[3]), int(sp[4])))

        self.inited = True
        self.last_refresh_time = time.time()

    def select_server(self, request_path):
        if Constants.host:
            return self.specified

        if Constants.is_sandbox:
            return self.sandbox

        if len(request_path) == 2:
            if request_path[1] == 2:
                return self.feedback
            if request_path[1] == 3:
                return self.emq
            return self.__select_server()
        return self.__select_server()

    def __select_server(self):
        if not Constants.auto_switch_host:
            return self.default_server

        priority_list = [sever.priority for sever in self.servers]
        all_priority = reduce(lambda x, y: x + [x[-1] + y], priority_list, [0])[-1]
        random_point = random.randint(0, all_priority)

        priority_sum = 0
        for index, priority in enumerate(priority_list):
            priority_sum += priority
            if random_point <= priority_sum:
                return self.servers[index]
        return self.default_server
