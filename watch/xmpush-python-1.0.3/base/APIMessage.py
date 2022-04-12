# coding=utf-8
from base.APIConstants import Constants


class MessageDict(dict):
    def __getattr__(self, item):
        try:
            return self[item]
        except KeyError:
            raise AttributeError(r"'message' object has no attribute %s'" % item)

    def __setattr__(self, key, value):
        self[key] = value


class PushTargetMessage(object):
    def __init__(self, push_message, target_type, target):
        self.push_message = push_message
        self.target_type = target_type
        self.target = target


class PushMessage(object):
    def __init__(self):
        self.__message_dict = MessageDict()

    def collapse_key(self, collapse_key):
        self.__message_dict[Constants.http_param_collapse_key] = collapse_key
        return self

    def payload(self, payload):
        self.__message_dict[Constants.http_param_payload] = payload
        return self

    def title(self, title):
        self.__message_dict[Constants.http_param_title] = title
        return self

    def description(self, description):
        self.__message_dict[Constants.http_param_description] = description
        return self

    def notify_type(self, notify_type):
        self.__message_dict[Constants.http_param_notify_type] = notify_type
        return self

    def time_to_live(self, time_to_live):
        self.__message_dict[Constants.http_param_time_to_live] = time_to_live
        return self

    def restricted_package_name(self, package_name):
        self.__message_dict[Constants.http_param_restricted_package_name] = [package_name]
        return self

    def restricted_package_names(self, package_names):
        self.__message_dict[Constants.http_param_restricted_package_name] = package_names
        return self

    def pass_through(self, pass_through=0):
        self.__message_dict[Constants.http_param_pass_through] = pass_through
        return self

    def notify_id(self, notify_id=0):
        self.__message_dict[Constants.http_param_notify_id] = notify_id
        return self

    def extra(self, extra):
        for k, v in extra.items():
            self.__message_dict['%s%s' % (Constants.http_param_extra_prefix, k)] = v
        return self

    def extra_element(self, key, value):
        self.__message_dict['%s%s' % (Constants.http_param_extra_prefix, key)] = value
        return self

    '''
        aps特殊字段适配
    '''
    def aps_element(self, key, value):
        self.__message_dict['%s%s' % (Constants.http_param_aps_prefix, key)] = value
        return self

    def aps_title(self, value):
        self.aps_element(Constants.http_param_aps_title, value)
        return self

    def aps_subtitle(self, value):
        self.aps_element(Constants.http_param_aps_subtitle, value)
        return self

    def aps_body(self, value):
        self.aps_element(Constants.http_param_aps_body, value)
        return self

    def aps_mutable_content(self, value):
        self.aps_element(Constants.http_param_aps_mutable_content, value)
        return self

    '''
        平滑推送, 目前仅对android消息有效
    '''
    def enable_flow_control(self):
        self.extra_element(Constants.extra_param_flow_control, '1')
        return self

    '''
        定时发送消息, timeToSend是用自1970年1月1日以来00:00:00.0UTC时间表示（以毫秒为单位的时间）
        注：仅支持七天内的定时消息
    '''
    def time_to_send(self, time_to_send):
        self.__message_dict[Constants.http_param_time_to_send] = time_to_send
        return self

    '''
        ios自定义通知数字角标
    '''
    def badge(self, badge):
        self.extra_element(Constants.extra_param_badge, badge)
        return self

    '''
        ios8推送消息快速回复类别
    '''
    def category(self, category):
        self.extra_element(Constants.extra_param_category, category)
        return self

    '''
        ios设置通知铃声
    '''
    def sound_url(self, sound_url):
        self.extra_element(Constants.extra_param_sound_url, sound_url)
        return self

    '''
        ios设置苹果apns通道
    '''
    def apns_only(self):
        self.extra_element(Constants.extra_param_ios_msg_channel, Constants.extra_param_ios_msg_channel_apns_only)
        return self

    '''
        ios设置长连接通道
    '''
    def connection_only(self):
        self.extra_element(Constants.extra_param_ios_msg_channel, Constants.extra_param_ios_msg_channel_connection_only)
        return self

    '''
        android message params build method
        need verify package_name must be not null
    '''
    def message_dict(self):
        try:
            self.__message_dict[Constants.http_param_restricted_package_name]
        except AttributeError as ex:
            raise ex

        return self.__message_dict

    '''
        ios message params build method
    '''
    def message_dict_ios(self):
        return self.__message_dict
