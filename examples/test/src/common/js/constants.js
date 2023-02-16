// 活动状态
export const STATUS_MAP = {
  not_driver: 'not-driver', // 非司机，需要注册
  not_join: 'not-join', // 未参与
  join_not_start: 'join-not-start', // 参与 & 未开始
  share_work: 'share-work', // 喊好友出车 拉起好友面板
  work_self: 'work-self', // 未邀请到2名好友，单行
  work: 'work', // 立即出车 双列 邀请到了2名好友
  ing_reward: 'ing-reward', // 显示昨日流水 单行 // 立即出车
  ing_reward_friends: 'ing-reward-friends', // 显示昨日流水 双行，拉起好友面板
  result: 'result', // 已结束
  act_not_join: 'act-not-join', // 活动结束 未参与
  act_not_out: 'act-not-out', // 活动结束 参与了 但是未出车
  reward_cal: 'reward-cal', // 奖励计算中
  reward_fail: 'reward-fail', // 发奖失败
  user_risk: 'user-risk', // 风控
  reward_end: 'reward-end', // 活动结束
  reward_risk: 'reward-risk', // 奖励被风控
  city_not_allow: 'city-not-allow' // 城市不在白名单
}

// 司机类型
export const CAR_TYPE = {
  UNIONE: 'nie_pan', // 出租车
  EXPRESS: 'fast', // 快车 优享
  PREMIER: 'advanced', // 专车
  LIGHT: 'light', // 轻快
  D1: 'd1',
  NOT_DRIVER: 'not-driver', // 非司机，需要注册
  OTHER: 'other' // 未在本次活动范围内
}
export const WX_APP_ID = 'wx52d7846cd3f9fba9'

// 跳转到车主端出车页面
export const DRIVER_HOME_PAGE = 'driverHomePage'
// 地址
const PROJECT_URL_PREFIX = process.env.API_ENV === 'development' ? 'http://h5test.intra.xiaojukeji.com' : 'https://page.udache.com'
export const PROJECT_URL = `${PROJECT_URL_PREFIX}/driver-activity-biz/driver-aggregate-activities/index.html#/pages/index`
export const DRIVER_REWARD_CENTER_URL = `${PROJECT_URL_PREFIX}/driver-biz/driver-reward-center/index.html`
// 小程序作为分包的路径
export const MINIPROGRAM_URL = 'pages/index/index'
// '/driver-aggregate-activities/pages/index'

// 分享文案
export const SHARE_INFO = {
  // iconUrl: 'https://dpubstatic.udache.com/static/dpubimg/hvpaMey1pt/2.png',
  iconUrl: 'https://dpubstatic.udache.com/static/dpubimg/-2S1KGLl3W/4.png',
  miniProgramImageUrl: 'https://dpubstatic.udache.com/static/dpubimg/aR0V7X10gp/1.png'
}
// 主会场分享数据
export const AGGREGATE_SHARE_INFO = {
  icon_url: 'https://dpubstatic.udache.com/static/dpubimg/-2S1KGLl3W/4.png',
  mini_img_url: 'https://dpubstatic.udache.com/static/dpubimg/kb0SesvssV/chunjie.png',
  mini_content: '春节出车领奖励，单单赚更多',
  title: '春节出车领奖励',
  content: '单单赚更多'
}

// 跑跑灰度测试
export const GRAY_TEST = 'gray'

// 邀请好友的分页数量
export const PAGE_SIZE = 20

// 主会场活动状态
export const AGGREGATE_STATUS_MAP = {
  new_years_day_prepare: 'new_years_day_prepare', // 元旦预热期
  new_years_day_ing: 'new_years_day_ing', // 活动期
  new_years_day_end: 'new_years_day_end', // 余热
  end: 'end' // 结束
}

// 页面标题
export const PaopaoTitle = '跑跑预约礼'

// 跑跑预约礼主按钮 type （两个按钮时使用）joinGroup，remindFriends，driveCar
export const MainBtnEventTypeMap = {
  joinGroup: 'joinGroup', // 加入司机群
  remindFriendsToDrive: 'remindFriendsToDrive', // 喊好友出车
  remindFriendsToJoin: 'remindFriendsToJoin', // 喊好友预约
  driveCar: 'driveCar', // 出车
  register: 'register', // 注册
  makeAppointment: 'makeAppointment' // 预约
}

export const PaoPaoDchn = 'B7Oml81'
