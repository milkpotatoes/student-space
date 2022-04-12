# coding=utf-8
from base.APIConstants import Constants
from base.APIError import APIError
from base.APISenderBase import Base

__TARGET_SPLITTER__ = ","


class APISubscribe(Base):
    """
    订阅topic API
    构造方法接收一个参数:
    @:param security 必须 - APP_SECRET
    """

    def subscribe_topic(self, reg_ids, topic, retry_times=3, **option_args):
        """
        订阅某个topic(reg_id)
        :param reg_ids: reg_id列表
        :param topic: 订阅topic
        :param retry_times: 重试次数
        :param option_args: 可选参数
            option_args为一个dict:
            包含两个可选参数{
                #Constants.http_param_restricted_package_name: value
                #Constants.http_param_category: value
            }
        """
        return self.__common_subscribe(Constants.request_path.V2_SUBSCRIBE_TOPIC, Constants.subscribe_type.RegId,
                                       reg_ids, topic, retry_times, **option_args)

    def unsubscribe_topic(self, reg_ids, topic, retry_times=3, **option_args):
        """
        取消订阅某个topic(reg_ids)
        :param reg_ids: reg_id列表
        :param topic: 订阅topic
        :param retry_times: 重试次数
        :param option_args: 可选参数(参见上述方法)
        """
        return self.__common_subscribe(Constants.request_path.V2_UNSUBSCRIBE_TOPIC, Constants.subscribe_type.RegId,
                                       reg_ids, topic, retry_times, **option_args)

    def subscribe_topic_alias(self, aliases, topic, retry_times=3, **option_args):
        """
        订阅某个topic(alias)
        :param aliases: alias列表
        :param topic: 订阅topic
        :param retry_times: 重试次数
        :param option_args: 可选参数(参见上述方法)
        """
        return self.__common_subscribe(Constants.request_path.V2_SUBSCRIBE_TOPIC_BY_ALIAS,
                                       Constants.subscribe_type.Alias, aliases, topic, retry_times, **option_args)

    def unsubscribe_topic_alias(self, aliases, topic, retry_times=3, **option_args):
        """
        取消订阅某个topic(alias)
        :param aliases: alias列表
        :param topic: 订阅topic
        :param retry_times: 重试次数
        :param option_args: 可选参数(参见上述方法)
        """
        return self.__common_subscribe(Constants.request_path.V2_UNSUBSCRIBE_TOPIC_BY_ALIAS,
                                       Constants.subscribe_type.Alias, aliases, topic, retry_times, **option_args)

    def __common_subscribe(self, request_path, subscribe_type, target, topic, retry_times=3, **option_args):
        params = dict()
        target_str = target
        if isinstance(target, list):
            target_str = __TARGET_SPLITTER__.join(target)

        if subscribe_type == Constants.subscribe_type.RegId:
            params[Constants.http_param_registration_id] = target_str
        elif subscribe_type == Constants.subscribe_type.Alias:
            params[Constants.http_param_alias] = target_str
        else:
            raise APIError(-1, 'subscribe type %s error' % subscribe_type, 'args error')

        params[Constants.http_param_topic] = topic
        for option_name in option_args:
            params[option_name] = option_args[option_name]

        return self._try_http_request(request_path, retry_times, **params)
