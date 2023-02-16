import { getProperty } from './utils'
import { STATUS_MAP } from './constants'
import { isWechatMiniprogram } from './env'
const { globalData = {}, Omega } = getApp()
const scene = globalData.scene || ''

let defalutCommonParams = {
  entrance_channel: '',
  dchn: '',
  instance_id: '',
  share_level: 1,
  first_uid: '',
  share_uid: '',
  open_id: '',
  actual: '',
  instance_status: '',
  can_join: '',
  can_initiate: '',
  uid: '',
  active_stage: '',
  xcx_sense_code: scene,
  scene: 1009,
  client_type: isWechatMiniprogram ? 'wechat' : 'nah5',
  city_id: 1,
  not_driver: 0, // 是否是非司机账号
  part: 0, // 全职司机0；兼职司机1
  product: '' // 快优专豪D1特惠 kuaiche niepan qingkuai youxiang zhuanche dione other notdriver
}
const notDriver = 'notdriver'
let aggregateCommonParams = {
  channel_id: '',
  dchn: '',
  city_id: '',
  active_stage: '',
  client_type: isWechatMiniprogram ? 'wechat' : 'nah5',
  xcx_sense_code: scene,
  open_id: '',
  uid: ''
}

export const setOmegaCommonParams = (params = {}) => {
  Object.assign(defalutCommonParams, params)
}

export const setAggregateCommonParams = (params = {}) => {
  Object.assign(aggregateCommonParams, params)
}

function getActiveStage (status) {
  // 活动阶段，1=助力报名期，2=出车期，3=活动结束
  const activityStatus1 = [STATUS_MAP.not_join, STATUS_MAP.join_not_start]
  const activityStatus2 = [
    STATUS_MAP.share_work,
    STATUS_MAP.work_self,
    STATUS_MAP.work,
    STATUS_MAP.ing_reward,
    STATUS_MAP.ing_reward_friends
  ]
  if (activityStatus1.includes(status)) {
    return 1
  } else if (activityStatus2.includes(status)) {
    return 2
  } else {
    return 3
  }
}
export const parseAxiosOmegaCommonParams = (axiosData = {}) => {
  const activityInfo = getProperty(axiosData, 'activity.data') || {}
  const shareInfo = getProperty(axiosData, 'share.data.instance') || {}
  const activeStage = getActiveStage(activityInfo.user_status)
  const canJoin = activityInfo.user_status === STATUS_MAP.not_join ? 1 : 0
  const actual = activityInfo.actual
  const instanceStatus = activeStage === 1 ? (actual >= 1 ? 2 : 1) : 3
  const category = activityInfo.category
  const part = activityInfo.driver_wechat_group_button ? 1 : 0

  const needAxiosData = {
    act_id: activityInfo.act_id,
    actual: actual, // 我的邀请人数
    instance_id: shareInfo.dsi || defalutCommonParams.instance_id || '', // 团长的dsi，助力之后变成自己的
    instance_status: instanceStatus,
    can_join: canJoin, // 非目标人群 false
    can_initiate: canJoin,
    uid: activityInfo.uid,
    active_stage: activeStage,
    not_driver: category === notDriver ? 1 : 0,
    part: part,
    product: category
  }

  setOmegaCommonParams(needAxiosData)
  // TODO 跟踪 uid 为空的埋点
  if (!activityInfo.uid) {
    _trackEventUid({
      status: activityInfo.user_status,
      data: needAxiosData
    })
  }
}

export const trackEvent = (eventId, params = {}) => {
  Omega.trackEvent(eventId, {
    ...defalutCommonParams,
    ...params,
    timestamp: new Date().getTime()
  })
}

export const trackAggregateEvent = (eventId, params = {}) => {
  if (!eventId) return
  Omega.trackEvent(eventId, {
    ...aggregateCommonParams,
    ...params,
    timestamp: new Date().getTime()
  })
}

const _trackEventUid = (status) => {
  let strfyData
  try {
    strfyData = JSON.stringify(status)
  } catch (error) {
    strfyData = 'stringify error'
  }
  trackEvent('wyc_mkt_ppyuyue_no_uid_status_sw', {
    status: strfyData
  })
}
