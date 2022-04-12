# coding=utf-8
from APISender import APISender
from base.APIMessage import *
from APITools import *
from APISubscribe import *

# push-demo
sender = APISender('APP_SECRET')

# build android message
message = PushMessage() \
    .restricted_package_name('PACKAGE_NAME') \
    .title('这是一条测试消息').description('这是一条测试消息') \
    .pass_through(0).payload('payload') \
    .extra({Constants.extra_param_notify_effect: Constants.notify_launcher_activity})

# build ios message
message_ios = PushMessage() \
    .description("这是一条ios测试消息") \
    .sound_url("default") \
    .badge(1) \
    .category("action") \
    .extra({"key": "value"})

# build ios message
message_ios10 = PushMessage() \
    .aps_title("title") \
    .aps_subtitle("subtitle") \
    .aps_body("body") \
    .aps_mutable_content("1") \
    .sound_url("default") \
    .badge(1) \
    .category("action") \
    .extra({"key": "value"})

# send message android
recv = sender.send(message.message_dict(), 'RED_ID')
print (recv)

# recv_ios = sender.send(message_ios10.message_dict_ios(), 'RED_ID_IOS')
# print recv_ios

tools = APITools('APP_SECRET')
# print tools.query_message_status('msg_id').data
# print tools.validate_reg_ids(['REG_ID', 'RED_ID1'])
# print tools.query_invalid_reg_ids()
# print tools.query_invalid_aliases()
# print tools.query_device_topics('package_name', 'RED_ID')
# print tools.query_device_presence('package_name', ['REG_ID', 'test'])
# print tools.query_device_aliases('package_name', 'REG_ID')
# print tools.check_schedule_job_exist('tcm111')
subscribe = APISubscribe('APP_SECRET')
# print subscribe.subscribe_topic('RED_ID', 'topic',
#                                 **{Constants.http_param_restricted_package_name: 'package_name'})
# print subscribe.unsubscribe_topic('RED_ID', 'topic',
#                                   **{Constants.http_param_restricted_package_name: 'package_name'})
