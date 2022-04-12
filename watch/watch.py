#!/usr/bin/python3

# from ast import While
# from ast import Try
import asyncio
from asyncore import loop
# from email import header, message
from pydoc import cli
# import imp
# from concurrent.futures import ThreadPoolExecutor
# from email import header, message
# from email.header import Header
# from http import client
# from pydoc import cli
import random
# from select import select
# from socket import socket
import time
from flask import Flask, make_response, render_template, request, session, g, redirect, url_for, abort, jsonify, Response, send_file
# from werkzeug.datastructures import ImmutableMultiDict
import json
from flask_socketio import SocketIO, emit, send, join_room, leave_room
from werkzeug.utils import secure_filename
import os
import httpx
import re
import pymysql
import redis
import datetime
# from flask_tortoise import Tortoise

app = Flask(__name__,  static_url_path='')
app.config['UPLOAD_FOLDER'] = 'user_avatar/'
# socketio = SocketIO(app, cors_allowed_origins='*')
socketio = SocketIO(app, logger=True, engineio_logger=True, policy_server=False, async_mode='eventlet', manage_session=False, cors_allowed_origins="*")
# import eventlet
# eventlet.monkey_patch()

RETURN_CODE = {"NOT_FOUNT": 404,
               "SUCCESS": 200,
               "NOT_ALLOWED": 500,
               "FAILD": 501
               }


url_pool = {
    "user": {
        "user_info": "https://szone-my.7net.cc/userInfo/GetUserInfo"
    },
    "exam": {
        "exam_list": "https://szone-score.7net.cc/exam/getClaimExams?studentName=<studentName>&schoolGuid=<schoolGuid>&startIndex=0&grade=<grade>&rows=3",
        "unclaim_exam": "https://szone-score.7net.cc/exam/getUnClaimExams?studentName=<studentName>&schoolGuid=<schoolGuid>",
        "claim_exam": "https://szone-score.7net.cc/exam/claimExam",
        "unclaim_exam_count": "https://szone-score.7net.cc/exam/getExamCount?studentName=<studentName>&schoolGuid=<schoolGuid>",
        "subjects": "https://szone-score.7net.cc/Question/Subjects"
    }
}


sql = {
    "register_full": """INSERT INTO userinfo(StudentName, Token, Mail, UserGuid, SchoolGuid, Grade, LatestExamGuid, ReadLatestExam, LatestUnclaimExam, ReadLatestUnclaimExam, IPAddress, Status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    "update_full": """UPDATE userinfo SET StudentName=?, Token=?, Mail=?, SchoolGuid=?, Grade=?, LatestExamGuid=?, ReadLatestExam=?, LatestUnclaimExam=?, ReadLatestUnclaimExam=?, IPAddress=?, Status=? Where UserGuid=?""",
    "update_token": """UPDATE userinfo SET Token=?, Status=? WHERE UserGuid=?""",
    "update_avatar": """UPDATE userinfo SET Avatar=? WHERE UserGuid=?""",
    "auth_devices": """INSERT INTO authdevices(DeviceUUID, UserGuid, DeviceName) VALUES (?, ?, ?)""",
    "register_simple": """INSERT INTO userinfo(StudentName, Token, Mail, UserGuid, Grade, IPAddress, Status)
    VALUES (?, ?, ?, ?, ?, ?, ?)""",
    "device_info_user": """SELECT DeviceUUID, UserGuid, DeviceName, AuthTime from authdevices WHERE UserGuid = ? """,
    "device_info": """SELECT DeviceUUID, UserGuid, DeviceName, AuthTime from authdevices WHERE DeviceUUID = ? """,
    "user_info": """SELECT StudentName, Token, UserGuid, SchoolGuid, Grade, IPAddress, Status, Avatar from userinfo WHERE UserGuid = ? """,
    "user_token": """SELECT StudentName, Token, UserGuid, SchoolGuid, Grade, IPAddress, Status from userinfo WHERE Token = ? """,
    'available_user_info': """SELECT StudentName, Token, UserGuid, SchoolGuid, Grade, IPAddress, LatestExamGuid, LatestUnclaimExam from userinfo WHERE Status = ? """,
    'mark_unavailable': """UPDATE userinfo SET Status=1 WHERE UserGuid = ?""",
    'update_read_unclaim': """UPDATE userinfo SET ReadLatestUnclaimExam = ? WHERE UserGuid = ?""",
    'update_unclaim': """UPDATE userinfo SET LatestUnclaimExam = ? WHERE UserGuid = ?""",
    'update_read_exam': """UPDATE userinfo SET ReadLatestExam = ? WHERE UserGuid = ?""",
    'update_exam': """UPDATE userinfo SET LatestExamGuid = ? WHERE UserGuid = ?""",
    'recall_device': """DELETE FROM authdevices WHERE DeviceUUID=?"""
}

MESSAGE_STATUS = {
    'READ': 0,
    'UNREAD': 1
}

ACCOUNTSTATUS = {
    'AVAILABLE': 0,
    'UNAVAILABLE': 1,
}

szone_headers = {
    "Version": "3.1.0"
}

USERGUID = {
    "UNSET": '0',
    'REGISTERED': '1'
}

ALLOW_ORIGIN = {"Access-Control-Allow-Origin": "*"}


def prepare_sql():
    for k in sql.keys():
        cur = g.mysql_db.cursor()
        # print("-----prepare sql script-----")
        # print("PREPARE %s FROM '%s';" % (k, sql[k]))
        cur.execute("PREPARE %s FROM '%s';" % (k, sql[k]))


def check_query_args(url, args):
    reg = re.compile(r'(?<=\<)(\w+)(?=\>)')
    request_params = reg.findall(url)
    miss = []
    for k in request_params:
        if not k in args:
            miss.append(k)
    return miss


def check_request_args(require, args):
    miss = []
    if args:
        for k in require:
            if not k in args:
                miss.append(k)
    else:
        miss = require
    return miss


def lower_first(str):
    return str[:1].lower()+str[1:]


def upper_first(str):
    return str[:1].upper()+str[1:]


def replace_query(url, args):
    reg = re.compile(r'(?<=\<)(\w+)(?=\>)')
    request_params = reg.findall(url)
    for k in request_params:
        if type(args) == dict:
            if upper_first(k) in args:
                # # print('\\<%s\\>' % k, args[upper_first(k)], url)
                url = re.sub('\\<%s\\>' % k, args[upper_first(k)], url)
        else:
            if upper_first(k) in args[1]:
                url = re.sub('\\<%s\\>' % k, args[0][upper_first(k)], url)

    return url


def connect_db():
    return pymysql.connect(host='localhost',
                           port=3306,
                           user='watch',
                           password='JCDxfFEGMakmHDhM',
                           database='watch')


def get_db():
    if not hasattr(g, 'mysql_db'):
        g.mysql_db = connect_db()
        prepare_sql()
    return g.mysql_db


def get_redis():
    if not hasattr(g, 'redis'):
        g.redis = redis.Redis(host='localhost', port=6379,
                              decode_responses=True)
    return g.redis


def method_not_allowed():
    return jsonify(code=RETURN_CODE['NOT_ALLOWED'], message="method not allowed"), 200, ALLOW_ORIGIN


def get_user_info(user_guid):
    cursor = get_db().cursor()
    try:
        # print("---sql script---")
        # print("SET @UserGuid = '%s';" % user_guid)
        # print("EXECUTE %s USING %s;" % ('user_info', '@UserGuid'))
        cursor.execute("SET @UserGuid = '%s';" % user_guid)
        cursor.execute("EXECUTE %s USING %s;" % ('user_info', '@UserGuid'))
        r = cursor.fetchall()
        return r
    except:
        get_db().rollback()


def update_token(userGuid, token):
    cur = get_db().cursor()
    # print("---sql script---")
    # print('SET @Token="%s", @Status, @UserGuid="%s' %
                # (token, ACCOUNTSTATUS['AVAILABLE'], userGuid))
    # print("EXECUTE update_token USING @Token, @Status, @UserGuid")
    cur.execute('SET @Token="%s", @Status, @UserGuid="%s' %
                (token, ACCOUNTSTATUS['AVAILABLE'], userGuid))
    cur.execute("EXECUTE update_token USING @Token, @Status, @UserGuid")
    get_db().commit()


def check_token(token):
    cursor = get_db().cursor()
    try:
        # print("---sql script---")
        # print("SET @Token = '%s';" % token)
        # print("EXECUTE %s USING %s;" % ('user_token', '@Token'))
        cursor.execute("SET @Token = '%s';" % token)
        cursor.execute("EXECUTE %s USING %s;" % ('user_token', '@Token'))
        r = cursor.fetchall()
        return r
    except:
        get_db().rollback()


def get_available_user():
    cur = get_db().cursor()
    # print("---sql script---")
    # print("SET @Status=%s" % 0)
    # print("EXECUTE available_user_info USING @Status;")
    cur.execute("SET @Status=%s" % 0)
    cur.execute("EXECUTE available_user_info USING @Status;")
    return cur.fetchall()


def mark_unavailable(user_guid):
    cur = get_db().cursor()
    try:
       # 执行SQL语句
        # print("---sql script---")
        # print('SET @UserGuid = %s' % user_guid)
        # print('EXECUTE mark_unavailable USING %s' % '@UserGuid')
        cur.execute('SET @UserGuid = %s' % user_guid)
        cur.execute('EXECUTE mark_unavailable USING %s' % '@UserGuid')
        # 提交到数据库执行
        get_db().commit()
    except:
       # 发生错误时回滚
        get_db().rollback()
    return


def update_read_unclaim_exam(user_guid, read, latest):
    cur = get_db().cursor()
    try:
       # 执行SQL语句
        # print("---sql script---")
        # print('SET @UserGuid = %s, @LatestUnclaimExam = %s, @ReadLatestUnclaimExam' %
                    # user_guid, latest, read)
        # print('EXECUTE update_read_unclaim USING %s' %
                    # '@UserGuid, @ReadLatestUnclaimExam')
        # print('EXECUTE update_unclaim USING %s' %
                    # '@UserGuid, @LatestUnclaimExam')
        cur.execute('SET @UserGuid = %s, @LatestUnclaimExam = %s, @ReadLatestUnclaimExam' %
                    user_guid, latest, read)
        cur.execute('EXECUTE update_read_unclaim USING %s' %
                    '@UserGuid, @ReadLatestUnclaimExam')
        cur.execute('EXECUTE update_unclaim USING %s' %
                    '@UserGuid, @LatestUnclaimExam')
        # 提交到数据库执行
        get_db().commit()
    except:
       # 发生错误时回滚
        get_db().rollback()
    return


def update_read_exam(user_guid, read, latest):
    cur = get_db().cursor()
    try:
       # 执行SQL语句
        # print("---sql script---")
        # print('SET @UserGuid = %s, @LatestExamGuid = %s, @ReadLatestExam' %
                    # user_guid, latest, read)
        # print('EXECUTE update_read_exam USING %s' %
                    # '@UserGuid, @ReadULatestExam')
        # print('EXECUTE update_exam USING %s' %
                    # '@UserGuid, @LatestExamGuid')
        cur.execute('SET @UserGuid = %s, @LatestExamGuid = %s, @ReadLatestExam' %
                    user_guid, latest, read)
        cur.execute('EXECUTE update_read_exam USING %s' %
                    '@UserGuid, @ReadULatestExam')
        cur.execute('EXECUTE update_exam USING %s' %
                    '@UserGuid, @LatestExamGuid')
        # 提交到数据库执行
        get_db().commit()
    except:
       # 发生错误时回滚
        get_db().rollback()
    return


def delete_device_info(uuid):
    db = get_db()
    cur = db.cursor()
    # print("---sql script---")
    # print('SET @DeviceUUID=%s' % uuid)
    # print('EXECUTE recall_device USING @DeviceUUID')
    cur.execute('SET @DeviceUUID="%s"' % uuid)
    cur.execute('EXECUTE recall_device USING @DeviceUUID')
    try:
        db.commit()
    except:
        db.rollback()
        return False
    return True


async def get_unclaim_exam(client, user_info, headers):
    url = replace_query(
        url_pool['exam']['unclaim_exam'], user_info)
    r = await client.get(url, headers=headers)
    return r.json()


async def get_exam_list(client, user_info, headers):
    url = replace_query(
        url_pool['exam']['exam_list'], user_info)
    r = await client.get(url, headers=headers)
    return r.json()


async def query_unclaim_info():
    title = [['StudentName', 'Token', 'UserGuid', 'SchoolGuid', 'Grade',
              'IPAddress', 'LatestExamGuid', 'LatestUnclaimExam']]
    """0:StudentName; 1:Token; 2:UserGuid; 3:SchoolGuid; 4:Grede; 5:IPAddress; 6:LExam; 7:LUExam"""
    async with httpx.AsyncClient(headers=szone_headers) as client:
        while(True):
            result = get_available_user()
            for row in result:
                url = replace_query(
                    url_pool['exam']['unclaim_exam_count'], title + [row])
                headers = {
                    'Token': row[1],
                    'X-Forward-For': row[5]
                }
                r = await client.get(url, headers=headers)
                data = r.json()
                if data['status'] != 200:
                    mark_unavailable(row[3])
                    return
                if data['data']['count'] > 0:
                    data = get_unclaim_exam(client, title+[row], headers)
                    if data['status'] == 200:
                        data = data['data']
                        if data[0]['list'][0]['examGuid'] != row[7]:
                            update_read_unclaim_exam(
                                row[2], MESSAGE_STATUS['UNREAD'], data[0]['list'][0]['examGuid'])
                await asyncio.sleep(0.2)
            await asyncio.sleep(300)


def get_auth_info(DeviceUUID):
    cur = get_db().cursor()
    # print("---sql script---")
    # print('SET @DeviceUUID="%s"' % DeviceUUID)
    # print('EXECUTE %s USING %s' % ('device_info', '@DeviceUUID'))
    cur.execute('SET @DeviceUUID="%s"' % DeviceUUID)
    cur.execute('EXECUTE %s USING %s' % ('device_info', '@DeviceUUID'))
    data = cur.fetchall()
    r = []
    if len(data) > 0:
        user_info = get_user_info(data[0][1])
        if len(user_info) > 0:
            user_info = user_info[0]
            user_info = {
                'Avatar': user_info[7],
                'StudentName': user_info[0],
                'Token': user_info[1],
                'UserGuid': user_info[2],
                'SchoolGuid': user_info[3],
                'Grade': user_info[4],
                'IPAddress': user_info[5],
                'Status': user_info[6],
            }
            r = [True, user_info]
    else:
        r = [False]
    return r


async def query_exam_info():
    title = [['StudentName', 'Token', 'UserGuid', 'SchoolGuid', 'Grade',
              'IPAddress', 'LatestExamGuid', 'LatestUnclaimExam']]
    time.sleep(1)
    async with httpx.AsyncClient(headers=szone_headers) as client:
        while(True):
            result = get_available_user
            for row in result:
                headers = {
                    'Token': row[1],
                    'X-Forward-For': row[5]
                }
                data = await get_exam_list(client, title+[row], headers)
                if data['status'] != 200:
                    mark_unavailable(row[3])
                    return
                if data['status'] == 200:
                    data = data['data']
                    update_read_exam(
                        client, MESSAGE_STATUS['UNREAD'], data['data'][0]['examGuid'])
                await asyncio.sleep(0.2)
            await asyncio.sleep(300)
    return


async def get_detail_info(user_info, headers):
    async with httpx.AsyncClient(headers=szone_headers) as client:
        data = await get_exam_list(client, user_info, headers)
        if data['status'] == 200:
            data = data['data']['list']
            user_info.update({
                'ReadLatestExam': MESSAGE_STATUS['UNREAD'],
                'LatestExamGuid': data[0]['examGuid']
            })

        url = replace_query(
            url_pool['exam']['unclaim_exam_count'], user_info)
        r = await client.get(url, headers=headers)
        data = r.json()
        if data['data']['unClaimCount'] > 0:
            data = await get_unclaim_exam(client, user_info, headers)

            if data['status'] == 200:
                data = data['data']
                user_info.update({
                    "LatestUnclaimExam": data[0]['list'][0]['examGuid'],
                    "ReadLatestUnclaimExam": MESSAGE_STATUS['UNREAD']
                })
        else:
            user_info.update({
                    "LatestUnclaimExam": "",
                    "ReadLatestUnclaimExam": MESSAGE_STATUS['READ']
                })

        cur = get_db().cursor()
        # print("---user info---")
        # print(user_info)
        # print("---key Token---")
        # print(user_info['Token'])
        # print("---sql script---")
        # print("""SET @StudentName='%s', @Token='%s', @Mail='%s', @UserGuid='%s', @SchoolGuid='%s', @Grade='%s',
            # @LatestExamGuid='%s', @ReadLatestExam=%s, @LatestUnclaimExam='%s', @ReadLatestUnclaimExam=%s, @IPAddress='%s', @Status=%s;"""
            # % (user_info['StudentName'], user_info['Token'], user_info['Mail'], user_info['UserGuid'], user_info['SchoolGuid'], user_info['Grade'], user_info['LatestExamGuid'],
            #   str(user_info['ReadLatestExam']), user_info['LatestUnclaimExam'], str(user_info['ReadLatestUnclaimExam']), user_info['IPAddress'], str(user_info['Status'])))
        cur.execute(
            # # print(
            """SET @StudentName='%s', @Token='%s', @Mail='%s', @UserGuid='%s', @SchoolGuid='%s', @Grade='%s',
            @LatestExamGuid='%s', @ReadLatestExam=%s, @LatestUnclaimExam='%s', @ReadLatestUnclaimExam=%s, @IPAddress='%s', @Status=%s;"""
            % (user_info['StudentName'], user_info['Token'], user_info['Mail'], user_info['UserGuid'], user_info['SchoolGuid'], user_info['Grade'], user_info['LatestExamGuid'],
               str(user_info['ReadLatestExam']), user_info['LatestUnclaimExam'], str(user_info['ReadLatestUnclaimExam']), user_info['IPAddress'], str(user_info['Status'])))
        # """SET @StudentName='%s', @Token='%s', @Mail='%s', @UserGuid='%s', @SchoolGuid='%s', @Grade='%s',
        # @LatestExamGuid='%s', @ReadLatestExam=%s, @LatestUnclaimExam='%s', @ReadLatestUnclaimExam=%s, @IPAddress='%s', @Status=%s;"""
        # % (user_info['StudentName'], user_info['Token'],user_info['Mail'], user_info['UserGuid'], user_info['SchoolGuid'], user_info['Mail'], user_info['Grade'], user_info['LatestExamGuid'],
        #    user_info['ReadLatestExam'], user_info['LatestUnclaimExam'], user_info['ReadLatestUnclaimExam'], user_info['IPAddress'], user_info['Status']))
        if len(check_token(user_info['Token'])) > 0:
            cur.execute("EXECUTE update_full USING @StudentName, @Token, @Mail, @SchoolGuid, @Grade, @LatestExamGuid, @ReadLatestExam, @LatestUnclaimExam, @ReadLatestUnclaimExam, @IPAddress, @Status, @UserGuid")
            # print("---sql script---")
            # print("EXECUTE update_full USING @StudentName, @Token, @Mail, @SchoolGuid, @Grade, @LatestExamGuid, @ReadLatestExam, @LatestUnclaimExam, @ReadLatestUnclaimExam, @IPAddress, @Status, @UserGuid")
        else:
            cur.execute("EXECUTE register_full USING @StudentName, @Token, @Mail, @UserGuid, @SchoolGuid, @Grade, @LatestExamGuid, @ReadLatestExam, @LatestUnclaimExam, @ReadLatestUnclaimExam, @IPAddress, @Status")
            # print("---sql script---")
            # print("EXECUTE register_full USING @StudentName, @Token, @Mail, @UserGuid, @SchoolGuid, @Grade, @LatestExamGuid, @ReadLatestExam, @LatestUnclaimExam, @ReadLatestUnclaimExam, @IPAddress, @Status")
        get_db().commit()
        # else:
        #     msg = jsonify(
        #         code=RETURN_CODE['FAILD'], message=data['message'])
        #     return msg, 200, ALLOW_ORIGIN


def close_db(self):
    # """Closes the database again at the end of the request."""
    if hasattr(g, 'mysql_db'):
        g.mysql_db.close()


def register_to_server(args):
    if 'token' in args:
        data = check_token(args['token'])
    if 'userGuid' in args:
        data = get_user_info(args['userGuid'])
    # # print(data)
    if len(data) == 0 or data[0][1] == args['token']:
        with httpx.Client(headers=szone_headers) as client:
            user_info = {
                'Token': args['token']
            }
            if 'mail' in args:
                user_info.update(Mail=args['mail'])
            else:
                user_info.update(Mail="")
            headers = {'Token': args['token'],
                       "X-Forward-For": request.remote_addr}
            # 获取用户信息，验证Token
            r = client.get(url_pool['user']['user_info'], headers=headers)
            data = r.json()
            if data['status'] == 200:
                data = data['data']
                user_info.update({
                    'UserGuid': data['userGuid'],
                    'Grade': data['grade'],
                    'StudentName': data['studentName'],
                    'SchoolGuid': data['schoolGuid'],
                    'IPAddress': request.headers['X-Real-Ip'],
                    'Status': 0
                })
                asyncio.get_event_loop().run_until_complete(get_detail_info(user_info, headers))
                return [True, user_info]
            else:
                msg = jsonify(
                    code=RETURN_CODE['FAILD'], message='Token error: %s' % data['message'])
                return [False, msg]
    else:
        data = data[0]
        # # print(data)
        if data[6] == ACCOUNTSTATUS['AVAILABLE']:
            return [True, {
                'StudentName': data[0],
                'Token': data[1],
                'UserGuid': data[2],
                'SchoolGuid': data[3],
                'Grade': data[4],
                'IPAddress': data[5],
                'Status': data[6]
            }]
        else:
            return [False, jsonify(
                code=RETURN_CODE['FAILD'], message='Token error: %s' % 'Token has expired.')
            ]
    # return True


@app.route('/register', methods=["GET", "POST"])
def register_push():
    if request.method != "POST":
        return method_not_allowed()
    # , 200
    else:
        req = request.get_json()
        miss_request = check_request_args(['token'], req.keys())
        miss_query = check_query_args(
            url_pool["user"]["user_info"], request.args)
        if len(miss_query) == 0 and len(miss_request) == 0:

            res = register_to_server(req)
            # user_info = {}
            if not res[0]:
                # user_info = res[1]
                msg = jsonify(code=RETURN_CODE['SUCCESS'], message="success", data={
                    "accessKey": "dfghjkl;"})
            else:
                msg = res[1]
        else:
            miss = miss_query.copy()
            miss.extend(miss_request)
            msg = jsonify(
                code=RETURN_CODE['FAILD'], message="missing vital parameters: %s" % ", ".join(miss))
        return msg, 200, ALLOW_ORIGIN


@app.route('/avatar/<string:img>')
def return_avatar(img):
    if '/' in img:
        return send_file(r'user_avatar/default.png', download_name=img)
    if img:
        try:
            return send_file(r'user_avatar/%s' % img, download_name=img)
        except:
            return send_file(r'user_avatar/default.png', download_name=img)


@app.errorhandler(404)
def page_not_found(error):
    return jsonify(code=RETURN_CODE['NOT_FOUNT'], message="page not found"), 404, {"Access-Control-Allow-Origin":	"*"}


# @app.route('/')
# def static_page():
#     # if request.cookies.get('userGuid'):
#     # page = render_template()
#     return app.send_static_file('stusp.html'),  200, ALLOW_ORIGIN


@app.route('/subscribe')
def web_subscribe():
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']
        while True:
            msg = ws.wait()
            ws.send(msg)
    return


def create_random_authcode():
    num = ""
    i = 0
    while i < 4:
        num += str(random.randrange(0, 9))
        i += 1
    return num


def create_authcode():
    num = create_random_authcode()
    while get_redis().get(num):
        num = create_random_authcode()
    # get_redis().set(num, USERGUID['UNSET'], ex=60)
    return num


@app.route('/api/authdevice', methods=['GET', 'POST'])
def register_authcode():
    req = request.get_json()
    miss = check_request_args(['token', 'authcode'], req)
    if len(miss) == 0:
        res = register_to_server(req)
        if res[0]:
            r = get_redis()
            device_info = r.get(req['authcode'])
            if device_info:
                device_info = json.loads(device_info)
                # print(device_info)
                cur = get_db().cursor()
                # print("---sql script---")
                # print('SET @DeviceUUID="%s", @DeviceName="%s", @UserGuid="%s"' %
                            # (device_info['deviceUUID'], device_info['deviceName'], res[1]['UserGuid']))

                # print('EXECUTE auth_devices USING @DeviceUUID, @UserGuid, @DeviceName')
                cur.execute('SET @DeviceUUID="%s", @DeviceName="%s", @UserGuid="%s"' %
                            (device_info['deviceUUID'], device_info['deviceName'], res[1]['UserGuid']))
                cur.execute(
                    'EXECUTE auth_devices USING @DeviceUUID, @UserGuid, @DeviceName')
                get_db().commit()
                r.set(
                    req['authcode'], USERGUID['REGISTERED'], ex=1
                )
                msg = jsonify({
                    "status": RETURN_CODE['SUCCESS'],
                    'message': 'Auth success'
                })
                send_auth_result(req['authcode'])
            else:
                msg = jsonify({
                    "status": RETURN_CODE['FAILD'],
                    'message': 'The authentication code does not exist or has expired'
                })
            # socketio.emit('authed',{
            #     'status': RETURN_CODE['SUCCESS'],
            #     'message': 'success',
            #     'data': {
            #         'userGuid': res[1]['UserGuid']
            #     }
            # }, to=req['authcode'], namespace='/api/authcode')
        else:
            msg = res[1]
    else:
        msg = jsonify({
            "status": RETURN_CODE['FAILD'],
            'message': 'Miss argument: %s' % ", ".join(miss)
        })

    return msg, 200, ALLOW_ORIGIN


@app.route('/setCookie', methods=['GET', 'POSt'])
def setCookie():
    deviceUUID = request.get_json()['deviceUUID']
    resp = make_response()
    resp.set_cookie("DeviceUUID", deviceUUID, secure=True,
                    samesite="None", expires=(datetime.datetime.today() + datetime.timedelta(days=30)))
    return resp, 200, ALLOW_ORIGIN


@app.route('/')
def jumpToPage():
    uuid = request.cookies.get("UserUUID")
    if get_auth_info(uuid)[0]:
        r = redirect('/watch', 302)
    else:
        r = redirect('/auth', 302)
    return r


@app.route('/auth')
def checkAuth():
    uuid = request.cookies.get("DeviceUUID")
    if get_auth_info(uuid)[0]:
        r = redirect('/watch', 302)
    else:
        r = app.send_static_file('auth.html'), 200, ALLOW_ORIGIN
    return r


@app.template_filter('tostr')
def _jinja2_filter_datetime(num):
    num = str(num)
    num = re.sub(r"\.0$", "", num)
    return num


@app.template_filter('strftime')
def _jinja2_filter_datetime(date, fmt=None):
    if fmt is None:
        fmt = '%Y-%m-%d %H:%M:%S'
    return date.strftime(fmt)


@app.template_filter('cutstring')
def _jinja2_filter_longstring(str, length=None):
    if length is None:
        length = 18
    if len(str) > length:
        str = str[:length-1]+"…"
    return str


@app.route('/exam')
def render_exam_page():
    exam_info = request.args
    uuid = request.cookies.get("DeviceUUID")
    user_info = get_auth_info(uuid)
    if user_info[0]:
        user_info = user_info[1]
        with httpx.Client(headers=szone_headers) as client:
            headers = {'Token': user_info['Token'],
                       "X-Forward-For": user_info['IPAddress']}
            url = url_pool['exam']['subjects']
            data = "examGuid=%s&studentCode=%s&schoolGuid=%s&grade=%s&ruCode=%s" % (
                exam_info['examGuid'], exam_info['studentCode'], user_info['SchoolGuid'], user_info['Grade'], exam_info['ruCode'])

            r = client.post(url, headers=headers, data={
                'examGuid': exam_info['examGuid'],
                'schoolGuid': user_info['SchoolGuid'],
                'ruCode': exam_info['ruCode'],
                'studentCode': exam_info['studentCode'],
                'grade': user_info['Grade']
            })

            r = r.json()
            if r['status'] == 200:
                subject_details = r['data']['subjects']

            client.close()
        r = render_template('exam.html.j2',
                            subject_details=subject_details
                            )
    else:
        r = redirect('/watch')
    return r


@app.route('/watch')
def render_watch_page():
    uuid = request.cookies.get("DeviceUUID")
    user_info = get_auth_info(uuid)
    if user_info[0]:
        user_info = user_info[1]
        h = int(datetime.datetime.now().strftime('%H'))
        t = ['凌晨', '凌晨', '凌晨', '凌晨', '凌晨', '凌晨',
             '上午', '上午', '上午', '上午', '上午', '上午',
             '下午', '下午', '下午', '下午', '下午', '下午',
             '晚上', '晚上', '晚上', '晚上', '晚上', '晚上']
        with httpx.Client(headers=szone_headers) as client:
            headers = {'Token': user_info['Token'],
                       "X-Forward-For": user_info['IPAddress']}
            url = replace_query(
                url_pool['exam']['exam_list'], user_info)
            r = client.get(url, headers=headers)
            # print(r.text, user_info, url)
            r = r.json()
            if r['status'] == 200:
                exam_list = r['data']['list']

            url = replace_query(
                url_pool['exam']['unclaim_exam'], user_info)
            r = client.get(url, headers=headers)
            # print("----- user info -----")
            # print(user_info)
            # print("----- url -----")
            # print(url)
            # print("----- response -----")
            # print(r.text)
            r = r.json()
            if r['status'] == 200:
                unclaim_exam_list_ori = r['data']
            unclaim_exam_list = []
            for month in unclaim_exam_list_ori:
                for exam_item in month['list']:
                    # if len(unclaim_exam_list) < 3:
                    unclaim_exam_list += [exam_item]

            client.close()

        r = render_template('watch.html.j2',
                            student_name=user_info['StudentName'],
                            time_interval=t[h],
                            exam_list=exam_list,
                            unclaim_exam_count=len(unclaim_exam_list),
                            unclaim_exam_list=unclaim_exam_list[:3]
                            )
    else:
        r = redirect('/auth')
    return r



@app.route('/api/watch')
def api_watch_data():
    uuid = request.cookies.get("DeviceUUID")
    user_info = get_auth_info(uuid)
    if user_info[0]:
        user_info = user_info[1]

        with httpx.Client(headers=szone_headers) as client:
            headers = {'Token': user_info['Token'],
                       "X-Forward-For": user_info['IPAddress']}
            url = replace_query(
                url_pool['exam']['exam_list'], user_info)
            r = client.get(url, headers=headers)
            r = r.json()
            if r['status'] == 200:
                exam_list = r['data']['list']

            url = replace_query(
                url_pool['exam']['unclaim_exam'], user_info)
            r = client.get(url, headers=headers)
            r = r.json()
            if r['status'] == 200:
                unclaim_exam_list_ori = r['data']
            unclaim_exam_list = []
            for month in unclaim_exam_list_ori:
                for exam_item in month['list']:
                    # if len(unclaim_exam_list) < 3:
                    unclaim_exam_list += [exam_item]

            client.close()

        r = jsonify({
            'status': RETURN_CODE['SUCCESS'],
            'message': 'Success',
            'data': {
                'userInfo': {
                    'name': user_info['StudentName'],
                    'userGuid': user_info['UserGuid']
                },
                'examList': exam_list,
                'unclaimExam': unclaim_exam_list[:3],
                'unclaim_exam_count': len(unclaim_exam_list)
            }
        })
    else:
        r = jsonify({
            'status': RETURN_CODE['FAILD'],
            'messgae': 'This device is not authed by any account'
        })
    return r


@app.route('/api/exam',methods=['GET', 'POST'])
def api_exam_data():
    exam_info = request.args
    uuid = request.cookies.get("DeviceUUID")
    user_info = get_auth_info(uuid)
    if user_info[0]:
        user_info = user_info[1]
        with httpx.Client(headers=szone_headers) as client:
            headers = {'Token': user_info['Token'],
                       "X-Forward-For": user_info['IPAddress']}
            url = url_pool['exam']['subjects']
            data = "examGuid=%s&studentCode=%s&schoolGuid=%s&grade=%s&ruCode=%s" % (
                exam_info['examGuid'], exam_info['studentCode'], user_info['SchoolGuid'], user_info['Grade'], exam_info['ruCode'])

            r = client.post(url, headers=headers, data={
                'examGuid': exam_info['examGuid'],
                'schoolGuid': user_info['SchoolGuid'],
                'ruCode': exam_info['ruCode'],
                'studentCode': exam_info['studentCode'],
                'grade': user_info['Grade']
            })

            r = r.json()
            if r['status'] == 200:
                subject_details = r['data']['subjects']

            client.close()
        r = jsonify({
            'status': RETURN_CODE['SUCCESS'],
            'message': 'Success',
            'data': subject_details
        })
    else:
        r = jsonify({
            'status': RETURN_CODE['FAILD'],
            'messgae': 'This device is not authed by any account'
        })
    return r


@socketio.on('connect', namespace='/api/device')
def join_to_room(uuid):
    join_room(uuid)


@socketio.on('recall_device', namespace='/api/device')
def recall_device(uuid):
    delete_device_info(uuid)
    emit('logout', {
        'status': RETURN_CODE['SUCCESS'],
        'message': 'Success.',
    })


@socketio.on('claim_exam', namespace='/api/device')
def claim_exam(data):
    uuid = data["DeviceUUID"]
    user_info = get_auth_info(uuid)
    if user_info[0]:
        user_info = user_info[1]
        headers = {'Token': user_info['Token'],
                   "X-Forward-For": user_info['IPAddress']}
        headers.update(szone_headers)
        r = httpx.post(url_pool['exam']['claim_exam'], headers=headers, data={
            'examGuid': data['examGuid'],
            'studentCode': data['studentCode']
        })
        r = r.json()
        if(r.status == 200):
            emit('claim_success')


@socketio.on('get_auth_code', namespace='/api/authcode')
def get_auth_code(deviceinfo):
    authcode = create_authcode()
    join_room(authcode)
    r = get_redis()
    # print(deviceinfo)
    r.set(authcode, json.dumps(deviceinfo))
    emit('authcode', {
        'status': RETURN_CODE['SUCCESS'],
        'message': 'Success.',
        'data': {
            'authcode': authcode
        }
    }, to=authcode)


# @socketio.on('wait_for_auth', namespace='/api/authcode')
def send_auth_result(authcode):
    r = get_redis()
    # while r.get(authcode):

    if r.get(authcode) != USERGUID['UNSET']:
        # res = register_to_server(
        #     {'userGuid': r.get(authcode)}
        # )
        # user_guid = res[1]
        socketio.emit('authed', {
            'status': RETURN_CODE['SUCCESS'],
            'message': 'success'
        }, to=authcode, namespace='/api/authcode')
        r.set(authcode, USERGUID['REGISTERED'], ex=1)
        # ws.close()


@app.route('/api/upload_avatar', methods=['POST'])
def uploader():
    f = request.files['file']
    fname = secure_filename(f.filename)
    f.save(os.path.join(app.config['UPLOAD_FOLDER'], fname))

    return jsonify({
        'status': RETURN_CODE['SUCCESS'],
        'message': 'Upload success',
        'data': {
            'url': '/acatar/%s' % fname
        }
    })


@app.route('/api/set_avatar', methods=['POST'])
def set_avatar():
    avatar = request.get_json()
    cur = get_db().cursor()
    # print("---sql script---")
    # print('SET @Avatar="%s", @UserGuid="%s' %
                # (avatar['avatar'], avatar['userGuid']))
    cur.execute('SET @Avatar="%s", @UserGuid="%s' %
                (avatar['avatar'], avatar['userGuid']))
    get_db().commit()
    return jsonify({
        'status': RETURN_CODE['SUCCESS'],
        'message': 'Set or update avatar success',
    })


# @socketio.of('auth', namespace='/api/auth')
# def auth_devices(authcode):

# executor = ThreadPoolExecutor(1)


# @app.before_first_request
# async def run_on_start():
#     # print(123456)
#     task1 = executor.submit(query_exam_info)
#     task2 = executor.submit(query_unclaim_info)
#     await task1
#     await task2
#     asyncio.run(query_unclaim_info())
#     asyncio.run(query_exam_info())
#     while True


if __name__ == '__main__':
    # app.run()
    # debug=True
    # from gevent import pywsgi
    # from geventwebsocket.handler import WebSocketHandler
    # server = pywsgi.WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
    # # print('server start')
    # server.serve_forever()
    socketio.run(app, debug=False)
    # import eventlet
    # eventlet.monkey_patch()
    # import eventlet.wsgi
    # eventlet.wsgi.server(eventlet.listen(('127.0.0.1', 5000)), app)
