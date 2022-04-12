# coding=utf-8
class Constants(object):
    def __init__(self):
        pass

    def enum(**self):
        return type('Enum', (), self)

    @classmethod
    def use_sandbox(cls):
        cls.is_sandbox = True

    @classmethod
    def use_official(cls):
        cls.is_sandbox = False

    @classmethod
    def use_http(cls):
        cls.http_protocol = "http"

    __VERSION__ = '1.0.3'
    __HTTP_GET__ = 0
    __HTTP_POST__ = 1

    _METHOD_MAP = {'GET': __HTTP_GET__, 'POST': __HTTP_POST__}

    sdk_version = "PYTHON_SDK_V1.0.3"
    max_message_length = 140
    auto_switch_host = True
    access_timeout = 5000
    http_protocol = "https"

    '''
        相关Push域名定义
    '''
    host_emq = "emq.xmpush.xiaomi.com"
    host_sandbox = "sandbox.xmpush.xiaomi.com"
    host_production = "api.xmpush.xiaomi.com"
    host_production_lg = "lg.api.xmpush.xiaomi.com"
    host_production_c3 = "c3.api.xmpush.xiaomi.com"
    host_production_feedback = "feedback.xmpush.xiaomi.com"
    host = None

    is_sandbox = False
    refresh_server_host_interval = 5 * 60

    '''
        HTTP parameter name
    '''
    http_param_registration_id = "registration_id"
    http_param_collapse_key = "collapse_key"
    http_param_job_key = "jobkey"
    http_param_payload = "payload"
    http_param_topic = "topic"
    http_param_alias = "alias"
    http_param_aliases = "aliases"
    http_param_user_account = "user_account"
    http_param_title = "title"
    http_param_description = "description"
    http_param_notify_type = "notify_type"
    http_param_notify_id = "notify_id"
    http_param_time_to_send = "time_to_send"
    http_param_url = "url"
    http_param_pass_through = "pass_through"
    http_param_messages = "messages"
    http_param_extra_prefix = "extra."
    http_param_aps_prefix = "aps_proper_fields."
    http_param_aps_title = "title"
    http_param_aps_subtitle = "subtitle"
    http_param_aps_body = "body"
    http_param_aps_mutable_content = "mutable-content"
    http_param_category = "category"
    http_param_job_id = "job_id"
    http_param_topics = "topics"
    http_param_topic_op = "topic_op"
    http_param_app_id = "app_id"
    http_param_start_ts = "start_time"
    http_param_end_ts = "end_time"
    http_param_job_type = "type"
    http_param_max_count = "max_count"

    '''
        sound_uri提供通知栏自定义铃声的URI
    '''
    extra_param_sound_uri = "sound_uri"
    extra_param_sound_url = "sound_url"
    extra_param_badge = "badge"
    extra_param_category = "category"
    extra_param_flow_control = 'flow_control'

    '''
        notify_effect定义点击通知栏的后续行为, 默认值情况下, 表示向客户端app传递消息, 其他值定义如下:
        NOTIFY_LAUNCHER_ACTIVITY: 通知栏点击后打开app的Launcher Activity
        NOTIFY_ACTIVITY: 通知栏点击后打开app的任一组件(开发者需要传入EXTRA_PARAM_INTENT_URI)
        NOTIFY_WEB: 通知栏点击后打开网页(开发者需要传入EXTRA_PARAM_WEB_URI)
        #详述请参考:http://dev.xiaomi.com/doc/?p=533
    '''
    extra_param_notify_effect = "notify_effect"
    notify_launcher_activity = "1"
    notify_activity = "2"
    notify_web = "3"
    extra_param_intent_uri = "intent_uri"
    extra_param_web_uri = "web_uri"
    extra_param_notification_ticker = "ticker"
    extra_param_class_name = "class_name"
    extra_param_intent_flag = "intent_flag"
    extra_param_ios_msg_channel = "ios_msg_channel"
    extra_param_ios_msg_channel_apns_only = "1"
    extra_param_ios_msg_channel_connection_only = "2"

    '''
        如果app在前台, 这时向客户端app发送非透传消息, 可以根据EXTRA_PARAM_NOTIFY_FOREGROUND参数值决定是否弹出通知栏
        默认情况下, app会弹出通知栏, 为了不弹出通知栏可以将EXTRA_PARAM_NOTIFY_FOREGROUND设置为"0"
    '''
    extra_param_notify_foreground = "notify_foreground"

    extra_param_alert_title = "apsAlert-title"
    extra_param_alert_body = "apsAlert-body"
    extra_param_alert_title_loc_key = "apsAlert-title-loc-key"
    extra_param_alert_title_loc_args = "apsAlert-title-loc-args"
    extra_param_alert_action_loc_key = "apsAlert-action-loc-key"
    extra_param_alert_loc_key = "apsAlert-loc-key"
    extra_param_alert_loc_args = "apsAlert-loc-args"
    extra_param_alert_launch_image = "apsAlert-launch-image"

    http_param_delay_while_idle = "delay_while_idle"
    http_param_dry_run = "dry_run"
    http_param_restricted_package_name = "restricted_package_name"
    http_param_payload_prefix = "data."
    http_param_time_to_live = "time_to_live"

    http_param_error_quota_exceeded = "QuotaExceeded"
    http_param_error_device_quota_exceeded = "QuotaExceeded"
    http_param_error_missing_registration = "MissingRegistration"
    http_param_error_invalid_registration = "InvalidRegistration"
    http_param_error_mismatch_sender_id = "MismatchSenderId"
    http_param_error_not_registration = "NotRegistered"
    http_param_error_message_too_big = "MessageTooBig"
    http_param_error_missing_collapse_key = "MissingCollapseKey"
    http_param_error_unavailable = "Unavailable"
    http_param_error_internal_server_error = "InternalServerError"
    http_param_error_invalid_ttl = "InvalidTtl"

    http_param_token_message_id = "id"
    http_param_token_canonical_reg_id = "registration_id"
    http_param_token_error = "Error"

    http_param_registration_ids = "registration_ids"
    http_param_json_payload = "data"
    http_param_json_success = "success"
    http_param_json_failure = "failure"
    http_param_json_multicast_id = "multicast_id"
    http_param_json_results = "results"
    http_param_json_error = "error"
    http_param_json_message_id = "message_id"

    http_param_start_date = "start_date"
    http_param_end_date = "end_date"
    http_param_trace_begin_time = "begin_time"
    http_param_trace_end_time = "end_time"
    http_param_trace_msg_id = "msg_id"
    http_param_trace_job_key = "job_key"

    '''
        Union 并集
        Intersection 交集
        Except 差集
    '''
    broadcast_topic_op = enum(
        Union='UNION',
        Intersection='INTERSECTION',
        Except='EXCEPT'
    )

    '''
        TARGET_TYPE_REGID regid消息类型
        TARGET_TYPE_ALIAS alias消息类型
        TARGET_TYPE_USER_ACCOUNT user-account消息类型
    '''
    target_type = enum(
        TARGET_TYPE_REGID=1,
        TARGET_TYPE_ALIAS=2,
        TARGET_TYPE_USER_ACCOUNT=3
    )

    request_type = enum(Message=1, Feedback=2, Emq=3)

    subscribe_type = enum(RegId=1, Alias=2)

    request_path = enum(
        V2_SEND=["/v2/send"],
        V2_REGID_MESSAGE=["/v2/message/regid"],
        V3_REGID_MESSAGE=["/v3/message/regid"],

        V2_SUBSCRIBE_TOPIC=["/v2/topic/subscribe"],
        V2_UNSUBSCRIBE_TOPIC=["/v2/topic/unsubscribe"],
        V2_SUBSCRIBE_TOPIC_BY_ALIAS=["/v2/topic/subscribe/alias"],
        V2_UNSUBSCRIBE_TOPIC_BY_ALIAS=["/v2/topic/unsubscribe/alias"],

        V2_ALIAS_MESSAGE=["/v2/message/alias"],
        V3_ALIAS_MESSAGE=["/v3/message/alias"],

        V2_BROADCAST_TO_ALL=["/v2/message/all"],
        V3_BROADCAST_TO_ALL=["/v3/message/all"],
        V2_BROADCAST=["/v2/message/topic"],
        V3_BROADCAST=["/v3/message/topic"],
        V2_MULTI_TOPIC_BROADCAST=["/v2/message/multi_topic"],
        V3_MILTI_TOPIC_BROADCAST=["/v3/message/multi_topic"],
        V2_DELETE_BROADCAST_MESSAGE=["/v2/message/delete"],

        V2_USER_ACCOUNT_MESSAGE=["/v2/message/user_account"],

        V2_SEND_MULTI_MESSAGE_WITH_REGID=["/v2/multi_messages/regids"],
        V2_SEND_MULTI_MESSAGE_WITH_ALIAS=["/v2/multi_messages/aliases"],
        V2_SEND_MULTI_MESSAGE_WITH_ACCOUNT=["/v2/multi_messages/user_accounts"],

        V1_VALIDATE_REGID=["/v1/validation/regids"],
        V1_GET_ALL_ACCOUNT=["/v1/account/all"],
        V1_GET_ALL_TOPIC=["/v1/topic/all"],
        V1_GET_ALL_ALIAS=["/v1/alias/all"],

        V1_MESSAGES_STATUS=["/v1/trace/messages/status"],
        V1_MESSAGE_STATUS=["/v1/trace/message/status"],
        V1_GET_MESSAGE_COUNTERS=["/v1/stats/message/counters"],

        V1_FEEDBACK_INVALID_ALIAS=["/v1/feedback/fetch_invalid_aliases", request_type.Feedback],
        V1_FEEDBACK_INVALID_REGID=["/v1/feedback/fetch_invalid_regids", request_type.Feedback],

        V1_REGID_PRESENCE=["/v1/regid/presence"],
        V2_REGID_PRESENCE=["/v1/regid/presence"],

        V2_DELETE_SCHEDULE_JOB=["/v2/schedule_job/delete"],
        V3_DELETE_SCHEDULE_JOB=["/v3/schedule_job/delete"],
        V2_CHECK_SCHEDULE_JOB_EXIST=["/v2/schedule_job/exist"],
        V2_QUERY_SCHEDULE_JOB=["/v2/schedule_job/query"],

        V1_EMQ_ACK_INFO=["/msg/ack/info", request_type.Emq],
        V1_EMQ_CLICK_INFO=["/msg/click/info", request_type.Emq],
        V1_EMQ_INVALID_REGID=["/app/invalid/regid", request_type.Emq],
    )
