import collections
import json
import logging
import time
import urllib.request, urllib.parse, urllib.error
import urllib.request, urllib.error, urllib.parse

from base.APIError import APIError
from base.APIHostSwitch import *

_MAX_BACKOFF_DELAY = 1024000


class JsonDict(dict):
    def __getattr__(self, item):
        try:
            return self[item]
        except KeyError:
            raise AttributeError(r"'JsonDict' object has no attribute %s'" % item)

    def __setattr__(self, key, value):
        self[key] = value


def _parse_json(body):
    """
    convert json object to python object
    :param body: response data
    """

    def _obj_hook(pairs):
        o = JsonDict()
        for k, v in pairs.items():
            o[str(k)] = v
        return o

    return json.loads(body, object_hook=_obj_hook)


def _build_request_url(server, request_path):
    return Constants.http_protocol + "://" + server.host + request_path[0]


def _http_call(url, method, authorization, token, **kw):
    """
    :param url: http request url
    :param method: http request method
    :param authorization: push authorization
    :param kw: params
    """
    params = urllib.parse.urlencode(_encode_params(**kw)).encode('utf-8')
    http_url = '%s?%s' % (url, params) if method == Constants.__HTTP_GET__ else url
    http_body = None if method == Constants.__HTTP_GET__ else params
    req = urllib.request.Request(http_url, data=http_body)
    if authorization:
        req.add_header('Authorization', 'key=%s' % authorization)
    if token:
        req.add_header('X-PUSH-AUDIT-TOKEN', token)
    if Constants.auto_switch_host and ServerSwitch().need_refresh_host_list():
        req.add_header('X-PUSH-HOST-LIST', 'true')
    req.add_header('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8')
    try:
        resp = urllib.request.urlopen(req, timeout=5)
        headers = resp.getheaders()
        host_list = None
        for header in headers:
            if header[0] == 'X-PUSH-HOST-LIST':
                host_list = header[1]
        if host_list:
            ServerSwitch().initialize(host_list)
        r = _parse_json(resp.read().decode())
        if hasattr(r, 'code'):
            if r.code != 0:
                raise APIError(r.code, r.get('description', ''), r.get('reason', ''))
        return r
    except urllib.error.URLError as e:
        raise APIError('-5', e.read(), 'http error')


def _encode_params(**kw):
    args = {}
    for k, v in kw.items():
        if isinstance(v, str):
            qv = v.encode('utf-8') if isinstance(v, str) else v
            args['%s' % k] = qv
        elif isinstance(v, collections.Iterable):
            for i in v:
                qv = i.encode('utf-8') if isinstance(i, str) else str(i)
                args['%s' % k] = qv
        else:
            qv = str(v)
            args['%s' % k] = qv
    return args


class Base(object):
    def __init__(self, security, token=None):
        self.security = security
        self.token = token
        self.proxy_ip = None
        self.proxy_port = None
        self.proxy = False

    def set_proxy(self, proxy_ip, proxy_port):
        self.proxy_ip = proxy_ip
        self.proxy_port = proxy_port
        self.proxy = True

    def set_token(self, token):
        self.token = token

    def _call_request(self, request_path, method, **kw):
        """
        call http request(include auto select server)
        :param request_path: http interface
        :param method: GET|POST
        :param kw: params
        """
        start = time.time()
        server = ServerSwitch().select_server(request_path)
        self.build_proxy()
        request_url = _build_request_url(server, request_path)
        try:
            ret = _http_call(request_url, method, self.security, self.token, **kw)
            if time.time() - start > 5:
                server.decr_priority()
            else:
                server.incr_priority()
            return ret
        except APIError as ex:
            logging.error("%s request: [%s] error [%s]" % (Constants.http_protocol, request_url, ex))
            server.decr_priority()
            raise ex

    def http_post(self, request_path, **kw):
        logging.info("POST %s" % request_path[0])
        return self._call_request(request_path, Constants.__HTTP_POST__, **kw)

    def http_get(self, request_path, **kw):
        logging.info("GET %s" % request_path[0])
        return self._call_request(request_path, Constants.__HTTP_GET__, **kw)

    def build_proxy(self):
        if self.proxy:
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({"%s:%s" % (self.proxy_ip, self.proxy_port)}),
                                          urllib.request.HTTPHandler(debuglevel=1))
            urllib.request.install_opener(opener)

    def _try_http_request(self, request_path, retry_times, method=Constants.__HTTP_POST__, **kw):
        is_fail, try_time, result, sleep_time = True, 0, None, 1
        while is_fail and try_time < retry_times:
            try:
                if method == Constants.__HTTP_POST__:
                    result = self.http_post(request_path, **kw)
                elif method == Constants.__HTTP_GET__:
                    result = self.http_get(request_path, **kw)
                else:
                    raise APIError('-2', 'not support %s http request' % method, 'http error')
                is_fail = False
            except APIError as ex:
                '''
                    URLError failure retry
                '''
                if ex.error_code == '-5':
                    is_fail = True
                logging.error('code:[%s] - description:[%s] - reason:[%s]' % (ex.error_code, ex.error, ex.request))
                try_time += 1
                time.sleep(sleep_time)
                if 2 * sleep_time < _MAX_BACKOFF_DELAY:
                    sleep_time *= 2
        if not result:
            raise APIError('-3', 'retry %s time failure' % retry_times, 'request error')
        return result
