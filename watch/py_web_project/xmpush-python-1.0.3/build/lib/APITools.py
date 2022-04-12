# coding=utf-8
from base.APIConstants import Constants
from base.APISenderBase import Base
import logging

__REG_ID_SPLITTER__ = ","


class APITools(Base):
    """
    API工具(查询消息状态, 统计, 删除定时任务等)
    构造方法接收一个参数:
    @:param security 必须 - APP_SECRET
    """

    def check_schedule_job_exist(self, job_id, retry_times=1):
        """
        check schedule job existence by job_id
        :param job_id: job_id
        :param retry_times: 重试次数
        """
        return self._try_http_request(Constants.request_path.V2_CHECK_SCHEDULE_JOB_EXIST, retry_times,
                                      **{Constants.http_param_job_id: job_id})

    def delete_schedule_job(self, job_id, retry_times=1):
        """
        delete schedule job by job_id
        :param job_id:
        :param retry_times: 重试次数
        """
        return self._try_http_request(Constants.request_path.V2_DELETE_SCHEDULE_JOB, retry_times,
                                      **{Constants.http_param_job_id: job_id})

    def delete_schedule_job_key(self, job_key, retry_times=1):
        """
        delete schedule job by job_key
        :param job_key:
        :param retry_times: 重试次数
        """
        return self._try_http_request(Constants.request_path.V3_DELETE_SCHEDULE_JOB, retry_times,
                                      **{Constants.http_param_job_key: job_key})

    def delete_topic(self, msg_id, retry_times=3):
        """
        根据消息id删除广播消息
        :param msg_id: 消息id
        :param retry_times: 重试次数
        """
        logging.info("'delete topic message with msg_id: %s'" % msg_id)
        return self._try_http_request(Constants.request_path.V2_DELETE_BROADCAST_MESSAGE, retry_times,
                                      **{Constants.http_param_token_message_id: msg_id})

    def query_device_aliases(self, package_name, reg_id, retry_times=3):
        """
        获取某个reg_id对应设备设置的所有alias
        :param package_name: 应用包名
        :param reg_id: 设备reg_id
        :param retry_times: 重试次数
        """
        param = {
            Constants.http_param_restricted_package_name: package_name,
            Constants.http_param_registration_id: reg_id
        }
        return self._try_http_request(Constants.request_path.V1_GET_ALL_ALIAS, retry_times, Constants.__HTTP_GET__,
                                      **param)

    def query_device_topics(self, package_name, reg_id, retry_times=3):
        """
        获取某个reg_id对应设备设置的所有topic
        :param package_name: 应用包名
        :param reg_id: 设备reg_id
        :param retry_times: 重试次数
        """
        param = {
            Constants.http_param_restricted_package_name: package_name,
            Constants.http_param_registration_id: reg_id
        }
        return self._try_http_request(Constants.request_path.V1_GET_ALL_TOPIC, retry_times, Constants.__HTTP_GET__,
                                      **param)

    def query_device_user_accounts(self, package_name, reg_id, retry_times=3):
        """
        获取某个reg_id对应设备设置的所有user_accounts
        :param package_name: 应用包名
        :param reg_id: 设备reg_id
        :param retry_times: 重试次数
        """
        param = {
            Constants.http_param_restricted_package_name: package_name,
            Constants.http_param_registration_id: reg_id
        }
        return self._try_http_request(Constants.request_path.V1_GET_ALL_ACCOUNT, retry_times, Constants.__HTTP_GET__,
                                      **param)

    def query_device_presence(self, package_name, reg_id, retry_times=3):
        """
        获取一个应用的某个用户目前的presence
        :param package_name: 包名
        :param reg_id: 设备reg_id(支持list或者单个)
        :param retry_times: 重试次数
        """
        request_path = Constants.request_path.V1_REGID_PRESENCE
        if isinstance(reg_id, list):
            request_path = Constants.request_path.V2_REGID_PRESENCE
            param_reg_id = __REG_ID_SPLITTER__.join(reg_id)
        else:
            param_reg_id = reg_id

        param = {
            Constants.http_param_restricted_package_name: package_name,
            Constants.http_param_registration_id: param_reg_id
        }
        return self._try_http_request(request_path, retry_times, Constants.__HTTP_GET__, **param)

    def query_invalid_reg_ids(self, retry_times=3):
        """
        拉取失效的reg_id列表, 每次请求最多返回1000个reg_id
        warn: 每次请求之后, 返回失效的reg_id将会从数据库删除
        :param retry_times: 重试次数
        :return:
        """
        return self._try_http_request(Constants.request_path.V1_FEEDBACK_INVALID_REGID, retry_times,
                                      Constants.__HTTP_GET__)

    def query_invalid_aliases(self, retry_times=3):
        """
        拉取失效的alias列表, 每次请求最多返回1000个alias
        :param retry_times: 重试次数
        """
        return self._try_http_request(Constants.request_path.V1_FEEDBACK_INVALID_ALIAS, retry_times,
                                      Constants.__HTTP_GET__)

    def query_message_status(self, msg_id, retry_times=3):
        """
        查询某个消息id状态
        :param msg_id: 消息id
        :param retry_times: 重试次数
        """
        logging.info("'query message trace msg_id: [%s]'" % msg_id)
        params = {Constants.http_param_trace_msg_id: msg_id}
        return self._try_http_request(Constants.request_path.V1_MESSAGE_STATUS, retry_times, Constants.__HTTP_GET__,
                                      **params)

    def query_message_group_status(self, job_key, retry_times=3):
        """
        查询某个job_key信息, 例如推送, 送达以及点击等计数
        :param job_key: job_key
        :param retry_times: 重试次数
        """
        logging.info("'query message group job_key: [%s]'" % job_key)
        params = {Constants.http_param_trace_job_key: job_key}
        return self._try_http_request(Constants.request_path.V1_MESSAGE_STATUS, retry_times, Constants.__HTTP_GET__,
                                      **params)

    def query_message_status_time_range(self, begin_time, end_time, retry_times=3):
        """
        获取一个时间区间内的消息的发送状态, 如果这个时间区间内的消息数量大于100, 则返回最近的100条。
        :param begin_time: 开始时间(单位: 毫秒(ms))
        :param end_time: 结束时间(单位: 毫秒(ms))
        :param retry_times: 重试次数
        """
        logging.info("'query message status time range: [%s - %s]'" % (begin_time, end_time))
        params = {
            Constants.http_param_trace_begin_time: begin_time,
            Constants.http_param_trace_end_time: end_time
        }
        return self._try_http_request(Constants.request_path.V1_MESSAGES_STATUS, retry_times, Constants.__HTTP_GET__,
                                      **params)

    def query_stat_data(self, start_date, end_date, package_name, retry_times=3):
        """
        获取指定时间段某个package对应的统计信息
        :param start_date: 起始日期(格式: yyyyMMdd)
        :param end_date: 结束日期(格式: yyyyMMdd)
        :param package_name: 包名
        :param retry_times: 重试次数
        """
        logging.info("'query package: %s stat info: [%s - %s]'" % (package_name, start_date, end_date))
        params = {
            Constants.http_param_start_date: start_date,
            Constants.http_param_end_date: end_date,
            Constants.http_param_restricted_package_name: package_name
        }
        return self._try_http_request(Constants.request_path.V1_GET_MESSAGE_COUNTERS, retry_times,
                                      Constants.__HTTP_GET__, **params)

    def validate_reg_ids(self, reg_ids, retry_times=3):
        """
        验证reg_id是否合法
        :param reg_ids: reg_id集合(支持单个)
        :param retry_times: 重试次数
        """
        params = {
            Constants.http_param_registration_ids: reg_ids
        }
        return self._try_http_request(Constants.request_path.V1_VALIDATE_REGID, retry_times, **params)

    def fetch_ack_info(self, package_name, retry_times=3):
        """
        拉取emq存储的ack信息
        :param package_name: 包名
        :param retry_times: 重试次数
        :return [ {"msgid": "msgId", "ackAt": "ackAt", "jobkey": "jobkey", "target": "target"} ... ]
        """
        params = {
            'package_name': package_name
        }
        return self._try_http_request(Constants.request_path.V1_EMQ_ACK_INFO, retry_times, Constants.__HTTP_GET__,
                                      **params)

    def fetch_click_info(self, package_name, retry_times=3):
        """
        拉取emq存储的点击信息
        :param package_name: 包名
        :param retry_times: 重试次数
        :return [ {"clickAt": "clickAt", "msgId": "msgId", "jobkey": "jobKey", "target": "target"} ...]
        """
        params = {
            'package_name': package_name
        }
        return self._try_http_request(Constants.request_path.V1_EMQ_CLICK_INFO, retry_times, Constants.__HTTP_GET__,
                                      **params)

    def fetch_invalid_reg_id(self, package_name, retry_times=3):
        """
        拉取无效的reg_id信息
        :param package_name: 包名
        :param retry_times: 重试次数
        :return [ "reg_id1", "reg_id2" ... ]
        """
        params = {
            'package_name': package_name
        }
        return self._try_http_request(Constants.request_path.V1_EMQ_INVALID_REGID, retry_times, Constants.__HTTP_GET__,
                                      **params)
