# coding=utf-8
from base.APIConstants import Constants
from base.APIError import APIError
from base.APISenderBase import Base

_BROADCAST_TOPIC_MAX = 5
_TOPIC_SPLITTER = ';$;'


class APISender(Base):
    """
    发送消息API(send push message class)
    构造方法接收两个参数:
    @:param security 必须 - APP_SECRET
    @:param token 可选 - 发送topic消息数超过1w所需要的验证token, 需到push运营平台申请
    """

    def send(self, push_message, reg_id, retry_times=3):
        """
        发送reg_id消息
        :param push_message: 消息体(请求参数对象)
        :param reg_id: reg_id(多个reg_id - list)
        :param retry_times: 重试次数
        """
        push_message[Constants.http_param_registration_id] = reg_id
        return self._try_http_request(Constants.request_path.V3_REGID_MESSAGE, retry_times,
                                      **push_message)

    def send_to_alias(self, push_message, alias, retry_times=3):
        """
        发送alias消息
        :param push_message: 消息体(请求参数对象)
        :param alias: alias(多个alias - list)
        :param retry_times: 重试次数
        """
        push_message[Constants.http_param_alias] = alias
        return self._try_http_request(Constants.request_path.V3_ALIAS_MESSAGE, retry_times,
                                      **push_message)

    def send_to_user_account(self, push_message, user_account, retry_times=3):
        """
        发送user_account消息
        :param push_message: 消息体(请求参数对象)
        :param user_account: user_account(多个user_account - list)
        :param retry_times: 重试次数
        """
        push_message[Constants.http_param_user_account] = user_account
        return self._try_http_request(Constants.request_path.V2_USER_ACCOUNT_MESSAGE, retry_times,
                                      **push_message)

    def broadcast(self, push_message, topic, retry_times=3):
        """
        发送topic消息(single)
        :param push_message: 消息体(请求参数对象)
        :param topic: topic(只支持单个)
        :param retry_times: 重试次数
        """
        push_message[Constants.http_param_topic] = topic
        return self._try_http_request(Constants.request_path.V2_BROADCAST, retry_times, **push_message)

    def broadcast_all(self, push_message, retry_times=3):
        """
        发送全量广播
        :param push_message: 消息体(请求参数对象)
        :param retry_times: 重试次数
        """
        package_names = push_message[Constants.http_param_restricted_package_name]
        request_path = Constants.request_path.V2_BROADCAST_TO_ALL
        if len(package_names) > 1:
            request_path = Constants.request_path.V3_BROADCAST_TO_ALL
        return self._try_http_request(request_path, retry_times, **push_message)

    def multi_broadcast(self, push_message, topics, broadcast_topic_op, retry_times=3):
        """
        发送多topic消息(multi)
        :param push_message: 消息体(请求参数对象)
        :param topics: topic集合(list)
        :param broadcast_topic_op: topic类型[交集, 并集, 差集]
        :param retry_times: 重试次数
        """
        if isinstance(topics, list):
            if len(topics) > _BROADCAST_TOPIC_MAX:
                raise APIError(-1, 'topics more than max topic 5', 'args limit')
            push_message[Constants.http_param_topics] = _TOPIC_SPLITTER.join(topics)
            push_message[Constants.http_param_topic_op] = broadcast_topic_op
            return self._try_http_request(Constants.request_path.V3_MILTI_TOPIC_BROADCAST, retry_times,
                                          **push_message)
        else:
            raise APIError(-1, 'topic must be list', 'args illegal')
