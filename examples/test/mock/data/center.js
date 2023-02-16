/* eslint-disable */
const STATUS_MAP = {
  // 跑跑预约
  not_driver: 'not-driver', // 非司机，需要注册
  not_join: 'not-join', // 未参与
  join_not_start: 'join-not-start', // 参与 & 未开始
  share_work: 'share-work', // 喊好友出车 拉起好友面板 // 本次没有
  work_self: 'work-self', // 未邀请到2名好友，单行
  work: 'work', // 立即出车 双列 邀请到了2名好友
  ing_reward: 'ing-reward', // 显示昨日流水 单行 // 立即出车
  ing_reward_friends: 'ing-reward-friends', // 显示昨日流水 双行，拉起好友面板
  result: 'result', // 已结束
  act_not_join: 'act-not-join', // 活动结束 未参与
  act_not_out: 'act-not-out', // 活动结束 参与了 但是未出车
  reward_cal: 'reward-cal', // 奖励计算中
  reward_fail: 'reward-fail', // 发奖失败
  user_risk: 'user-risk', // 风控 活动参与失败
  reward_end: 'reward-end', // 活动结束
  reward_risk: 'reward-risk', // 奖励被风控
  city_not_allow: 'city-not-allow' // 城市不在白名单
}
export default {

  errno: 0,
  errmsg: 'success',
  data: {
    car_type: 'fast', // "fast|advanced|other|nie_pan|light|d1|not-driver"
    include_car_type: ['fast', 'light', 'd1'],
    status: 'end', // gray new_years_day_prepare new_years_day_ing new_years_day_end 跑跑预约礼活动期/预热期/活动期/余热期/结束期
    // gray | new_years_day_prepare | new_years_day_ing | new_years_day_end | national_prepare | national_ing | end
    title_img: 'https://dpubstatic.udache.com/static/dpubimg/62efc763-278c-43a4-89db-d43208f5b8a8.png',
    bottom_logo: 'https://dpubstatic.udache.com/static/dpubimg/b68d2984-3767-484d-a963-3d1e89fc0bbe.png',
    share_info: {
      // 主会场分享数据 
      icon_url: 'https://dpubstatic.udache.com/static/dpubimg/-2S1KGLl3W/4.png',
      mini_img_url: 'https://dpubstatic.udache.com/static/dpubimg/6bf6577f-e7c4-4ad3-a756-762f96f6f4dc.png',
      mini_content: '元宵节出车 单多奖励多',
      title: '元宵节出车 单多奖励多',
      content: '感谢春节付出，开工好运连连'
    },
    backup_tip: ['仅限轻快、快车、', '优享、滴滴定制车司机', '可参与此活动'],
    "service_fee":{
      "list":[
          {
              "date_text":"腊月二十六-腊月二十八",
              "fee":"{+5}元/单"
          },
          {
              "date_text":"除夕-正月初二",
              "fee":"{+7}元/单"
          },
          {
              "date_text":"正月初三-正月初六",
              "fee":"{+7}元/单"
          },
          {
              "date_text":"正月初七-正月初九",
              "fee":"{+7}元/单"
          }
      ],
      "jump_url":"",
      "title":"司机服务费 全额给司机",
      "notice":"注：北京市为司机当前城市"
    },
    notice: {
      head_title: '节假日出车 送你出行分',
      list: [
        '4.30-5.1两天高峰每单额外{+0.2出行分}',
        '4.30-5.1两天高峰每单额外{+0.2出行分}',
        "1月31日至2月6日<br>高峰期出行分额外：{+0.2分/单}",
        "1月31日至2月6日<br>出行分高峰单每单额外：{+0.2分/单}"
      ]
    },

    // 预热期&活动期-司机专属推荐位 1张   task时长冲单，pope冲单，单单（TODO）
    special_reward: [
      {
        reward_type: 'order_rush',
        title: '回归司机专属',
        reward_text: '完成x单得y元',
        time_text: '时间：1.1 09:00-11:00',
        jump_url: ''
      },
      {
        reward_type: 'order_rush',
        title: '回归司机专属',
        reward_text: '完成x单得y元',
        time_text: '时间：1.1 09:00-11:00',
        jump_url: ''
      }
    ],

    // 预热期-加速卡 1-3张 剩余向右滑动
    reward_card: {
      title: '流水加速卡疯抢中',
      count_down_sec: 86400, //剩余时间倒计时, 剩余X天 10:23:29
      city: '北京市12', //北京市司机专属
      list: [
        {
          head_title: ['1月1日', '多时段生效'],
          desc: '流水加速',
          "activity_id": "123432432", // 埋点用
          reward_detail: '+15%',
          button_type: 2, //0已购买/已领取  1即将售卖  2可购买/可领取
          prefix: '¥',
          button_text: '12月22日开抢', // {9.9}元
          jump_url: 'xxx' //跳转详情页
        },
        {
          head_title: ['1月1日', '多时段生效'],
          desc: '流水加速',
          "activity_id": "123432432", // 埋点用
          reward_detail: '+15%',
          button_type: 0, //0已购买/已领取  1即将售卖  2可购买/可领取
          prefix: '¥',
          button_text: '{9.9}抢', // {9.9}元
          jump_url: 'xxx' //跳转详情页
        }
      ]
    },

    // 预热期-堵车卡 1-3张 最多三张
    traffic_card: {
      title: '堵车无忧卡',
      // count_down_sec: 200, //剩余时间倒计时, 剩余X天 10:23:29
      list: [
        {
          head_title: ['1月1日', '12:00-14:00'],
          "activity_id": "123432432", // 埋点用
          desc: '每分钟补贴',
          reward_detail: '{1}元',
          button_type: 2, //0已购买/已领取  1即将售卖  2可购买/可领取
          button_text: '立即领取',
          jump_text: '查看详情',
          jump_url: 'xxx' //跳转详情页
        }
      ]
    },

    // 预热期-task冲单奖&时长冲单奖 1-3张 剩余向右滑动
    task_order_rush: {
      title: '冲单奖',
      count_down_sec: 100, //剩余时间倒计时, 剩余X天 10:23:29
      list: [
        {
          reward_type: 'smart_accu', // smart_accu智能盘古 smart_accu_sprint智能冲单 realtime_sprint实时冲单 terra_order_online_time时长完单
          head_title: ['1月1日', '12:00-14:00'],
          desc: '完成X单得',
          reward_detail: '{12}元',
          button_type: 2, //0已购买/已领取  1即将售卖  2可购买/可领取
          button_text: '立即领取',
          jump_text: '查看详情',
          jump_url: 'xxx', //跳转详情页
          activity_id: 9292929
        },
        {
          reward_type: 'terra_order_online_time', // smart_accu智能盘古 smart_accu_sprint智能冲单 realtime_sprint实时冲单 terra_order_online_time时长完单
          head_title: ['1月1日', '12:00-14:00'],
          desc: '完成X单得',
          reward_detail: '{12}元',
          button_type: 1, //0已购买/已领取  1即将售卖  2可购买/可领取
          button_text: '立即领取',
          jump_text: '查看详情',
          jump_url: 'xxx', //跳转详情页
          activity_id: 8
        },
        {
          reward_type: 'smart_accu', // smart_accu智能盘古 smart_accu_sprint智能冲单 realtime_sprint实时冲单 terra_order_online_time时长完单
          head_title: ['1月1日', '12:00-14:00'],
          desc: '完成X单得',
          reward_detail: '{12}元',
          button_type: 0, //0已购买/已领取  1即将售卖  2可购买/可领取
          button_text: '立即领取',
          jump_text: '查看详情',
          jump_url: 'xxx', //跳转详情页
          activity_id: 8
        },
        {
          reward_type: 'smart_accu', // smart_accu智能盘古 smart_accu_sprint智能冲单 realtime_sprint实时冲单 terra_order_online_time时长完单
          head_title: ['1月1日', '12:00-14:00'],
          desc: '完成X单得',
          reward_detail: '{12}元',
          button_type: 0, //0已购买/已领取  1即将售卖  2可购买/可领取
          button_text: '立即领取',
          jump_text: '查看详情',
          jump_url: 'xxx', //跳转详情页
          activity_id: 9
        }
      ]
    },

    // 订单预测
    order_forecast: {
      head_title: '订单预测',
      desc: [
        '平台预测12月25日订单将比平时多22.3%，请各位师傅合理安排时间，即使关注和参与你的专属奖励哟～',
        '根据预测，订单集中在办公楼、餐厅、大型商场等城市热门地点，且这些地点的滴滴特快订单也会更多哦！ 请各位师傅多去热门地点接单，订单多多，收入更高~',
        '滴滴特快每一单基础计价金额至少高于快车计价5%，您还有机会得到乘客的加价金额 （备注可以写小字）'
      ],
      type: 'bar', // bar lin
      average: 1875270,
      area: 1,
      data: [
        { value: ['04.30', 2202298] },
        { value: ['05.01', 2296068] },
        { value: ['05.02', 1983342] },
        { value: ['05.03', 1563570] },
        { value: ['05.04', 1596826] },
        { value: ['05.05', 1609517] }
      ]
    },
    /* bottom_acts: [
        {
          title: '推荐亲友，轻松赚钱',
          desc: '多邀多得，上不封顶',
          img:
            'https://dpubstatic.udache.com/static/dpubimg/295f7f86-3d20-4b13-b892-efd8f9899b0b.png',
          jump_url:
            'https://page-mp.udache.com/driver-recommend/CN/nocar-promotion/index.html?d=240&cId=0&sortid=127549&sort=27807&usce_sub_channel=127549&usce_channel=27807',
          bottom_desc: '点击查看'
        }
      ], 
    */
    // 预热期-奖励预告（无需领取奖励）每种奖励最多3张  时段单单奖，pope冲单，时长保底，翻倍，瓜分，单单
    prepare_acts: {
      head_title: '元旦奖励预告',
      supply_reward: {
        title: '时段单单奖',
        sub_title: '假日出车，高额奖励拿不停',
        desc: '今日出车，每单最高{+3}元',
        time_text: '12月23日至12月31日天天有奖',
        jump_url: '' // 奖励详情页
      },
      list: [
        {
          title: '- 冲击排行榜 瓜分拿现金 -',
          items: [
            {
              title: ['最高完成12单参与排名', '最高瓜分{XX}元'],
              type: 'order_rush',
              jump_url: 'http://www.baidu.com',
              time_text: '时间：4.30 09:00-11:00'
            },
            {
              title: ['完成12单参与排名', '最高瓜分{XX}元'],
              type: 'order_rush',
              jump_url: 'http://www.baidu.com',
              time_text: '4.30 09:00-11:00'
            }
          ]
        },
        {
          title: '- 高额翻倍奖 出车赚大钱 -',
          items: [
            {
              title: ['每单流水', '最高翻{1.2}倍'],
              type: 'gua_fen',
              jump_url: 'http://www.baidu.com',
              time_text: '4.30 09:00-11:00'
            }
          ]
        },
        {
          title: '- 冲单赢大奖 努力有回报 -',
          items: [
            {
              title: ['完成X单得X元', '最高可得{120}元'],
              type: 'welfare',
              jump_url: 'http://www.baidu.com',
              time_text: '4.30 09:00-11:00'
            }
          ]
        },
        {
          title: '- 时长保底奖 收入有保障 -',
          items: [
            {
              title: ['假期出车收入有保障', '最高可保{900}元'],
              type: 'welfare',
              jump_url: 'http://www.baidu.com',
              time_text: '4.30 09:00-11:00'
            }
          ]
        }
      ]
    },
    today_acts: {
      head_title: '今日奖励',
      supply_reward: {
        title: '时段单单奖',
        sub_title: '假日出车，高额奖励拿不停',
        desc: '今日出车，每单最高{+3}元',
        time_text: '12月23日至12月31日天天有奖',
        jump_url: '' // 奖励详情页
      },
      list: [
        {
          title: '- 今天不出车就亏大了呀 -',
          items: [
            {
              title: ['假期出车收入有保障', '最高可保{1200}元'],
              time_text: '08:00-10:00',
              type: 'welfare',
              jump_url: 'http://www.baidu.com'
            },
            {
              title: ['完成15单可得10元', '最高可得{10}元'], //
              time_text: '12.25 9:00-10:00',
              type: 'order_rush',
              jump_url: 'http://www.baidu.com'
            },
            {
              title: ['完成15单可得10元', '最高可瓜分{10}元'], //
              time_text: '12.25 9:00-10:00',
              type: 'gua_fen',
              jump_url: 'http://www.baidu.com'
            }
          ]
        }
      ]
    },
    ing_acts: [
      '专属完单补贴',
      '高峰冲刺任务补贴高峰冲刺任务补贴高峰冲刺任务补贴'
    ],
    banner: [
      { // 332 * 90
        img_url:
          'https://dpubstatic.udache.com/static/dpubimg/6FZn66Om6K/banner.png', //banner图片
        jump_url: 'xxx' //跳转链接
      },
      {
        img_url:
          'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.jj20.com%2Fup%2Fallimg%2Ftp09%2F21042G4331941H-0-lp.jpg&refer=http%3A%2F%2Fimg.jj20.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1642658638&t=deab23951bf59fb4c49f723de99db9cd', //banner图片
        jump_url: 'xxx' //跳转链接
      },
      {
        img_url:
          'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.jj20.com%2Fup%2Fallimg%2Ftp09%2F21042G4331941H-0-lp.jpg&refer=http%3A%2F%2Fimg.jj20.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1642658638&t=deab23951bf59fb4c49f723de99db9cd', //banner图片
        jump_url: 'xxx' //跳转链接
      }
    ],
    order_order_reward: {
      // 时段单单奖
      head_title: '中秋出车 单单加价',
      title: '每日8:00-20:00单单有奖励',
      jump_url: 'https://www.baidu.com',
      items: [
        {
          desc: '每单最高{+2.0元}',
          time_text: '4月23日'
        },
        {
          desc: '每单最高{+2.0元}',
          time_text: '4月23日'
        },
        {
          desc: '每单最高{+2.0元}',
          time_text: '4月23日'
        }
      ]
    },
    group_task: {
      text: ['组队冲单前50名小队', '赢取百万大奖'],
      head_title: '组队冲刺百万大奖',
      jump_url: 'https://v.didi.cn/GarEQ8o',
      img_url:
        'https://dpubstatic.udache.com/static/dpubimg/40262818-a93c-4825-a12f-7b276167df48.png',
      time_text: '活动时间：9.20-10.2'
    },
    toggle_driver_reward: {
      activity: {
        cid: 'DriverNationalActivityComponentID',
        material: {},
        data: {
          uid: 55555,
          actual: 2,
          act_id: 2345,
          city_list: null,
          category: 'kuaiche', // kuaiche niepan qingkuai youxiang zhuanche dione other notdriver
          xid: 2021,
          head_image:
            'https://dpubstatic.udache.com/static/dpubimg/aa33fdef-bea3-4854-8ff7-a126b253e956.png',
          start_time: '2021-09-30 16:57:33',
          end_time: '2021-10-01 16:57:33',
          count_down_mills: 2064355600,
          timestamp: 2064355600,
          /* 
            {
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
          */
          user_status: STATUS_MAP.reward_end,
          out_title: '跑跑预约礼',
          button_desc: '立即预约', // 主按钮
          // 新增字段，“邀好友出车按钮”文案，若有就展示副按钮
          invite_button_desc: '邀请好友出车',
          authorization_desc: `为了提升您的用户体验， 滴滴平台开展“跑跑预约礼”活动。如您希望参与该活动并作为被邀请人并获得相应的奖励，则您的个人信息（以下简称“授权信息”），具体包括车主头像、活跃程度、返佣比例、姓名等 ，将提供和共享给邀请人，以便您与邀请人能参与活动并获得相应奖励。\n1.您授权后，对上述信息进行必要的使用、处理以及共享、储存，滴滴平台严格履行保密义务并遵守《个人信息保护及隐私政策》的规定。 本授权书的授权期限为自您点击“同意并预约”之日起生效。\n
            2.您参与活动后，滴滴可根据活动情况，将您注册滴滴时提交姓名和手机号信息在隐去一部分信息后（如王xx，或者尾号xxxx的形式），在“城市榜单”中展示。<br>
            为了提升您的用户体验， 滴滴平台开展“跑跑预约礼”活动。如您希望参与该活动并作为被邀请人并获得相应的奖励，则您的个人信息（以下简称“授权信息”），具体包括车主头像、活跃程度、返佣比例、姓名等 ，将提供和共享给邀请人，以便您与邀请人能参与活动并获得相应奖励。
            您授权后，对上述信息进行必要的使用、处理以及共享、储存，滴滴平台严格履行保密义务并遵守《个人信息保护及隐私政策》的规定。 本授权书的授权期限为自您点击“同意并预约”之日起生效。<br>
            3.您参与活动后，滴滴可根据活动情况，将您注册滴滴时提交姓名和手机号信息在隐去一部分信息后（如王xx，或者尾号xxxx的形式），在“城市榜单”中展示。<br>
            为了提升您的用户体验， 滴滴平台开展“跑跑预约礼”活动。如您希望参与该活动并作为被邀请人并获得相应的奖励，则您的个人信息（以下简称“授权信息”），具体包括车主头像、活跃程度、返佣比例、姓名等 ，将提供和共享给邀请人，以便您与邀请人能参与活动并获得相应奖励。
            您授权后，对上述信息进行必要的使用、处理以及共享、储存，滴滴平台严格履行保密义务并遵守《个人信息保护及隐私政策》的规定。 本授权书的授权期限为自您点击“同意并预约”之日起生效。
            您参与活动后，滴滴可根据活动情况，将您注册滴滴时提交姓名和手机号信息在隐去一部分信息后（如王xx，或者尾号xxxx的形式），在“城市榜单”中展示。
            `,
          participation: true,
          driver_out: true, // 当天司机是否出车
          activity_desc: '预约12.31-1.1出车{额外}享流水加倍',
          button_bottom_tip: '2021年9月29日邀请结束', // 100万+名司机与你一起报名出车
          act_out_status: 1,
          // 背景文字图的链接
          // background_text_pic: 'https://dpubstatic.udache.com/static/dpubimg/a_1YUwXrk2/yuandan_activity_step.png',
          // 新增字段，头图副标题
          background_subtitle: '12月xx日-1月xx日 亿级奖励回馈师傅',
          // 新增字段，按钮上的气泡文案
          button_bubble: [
            '点击“催好友”出车功能，可一键喊好友上线',
            '报名后出车的司机，人均多赚了27.89元',
            '一起出车得现金奖励，邀老用户奖更多',
            '您上一次参与活动赚了27.89元'
          ],
          // 新增字段，“加入司机群”按钮文案,若有就展示按钮
          // "driver_wechat_group_button": "加入司机微信群",
          templates: ['zo6n44hldFOqsWFGtAkOcrC-WOgsLgyrncfDd17ehAA'],
          invitation_title: '邀好友12.31-1.1同出车', // 我的邀请popup 文案
          invitation_desc: '额外享好友流水奖励', // 我的邀请popup 文案
          city_name: '北京', // 北京大区邀请排行
          // "toast_title" : {
          //   "status": 'already-join',
          //   "text": '已预约过活动'
          // },
          // toast_title : {
          // status: 'ing-not-join'，
          // text: '预约已结束，可以参加其他奖励过活动'
          // },
          main_task_progress: {
            current_value: '690000',
            current_percent: '2',
            next_percent: '3',
            all_rights: [
              {
                number: '0',
                rate: '1'
              },
              {
                number: '30000',
                rate: '1.5'
              },
              {
                number: '600000',
                rate: '2'
              },
              {
                number: '1000000',
                rate: '3'
              }
            ]
          },
          main_task_overview: {
            total_cnt: '600000',
            avatars: [
              'https://img2.baidu.com/it/u=4087057811,445331467&fm=26&fmt=auto&gp=0.jpg',
              'https://img2.baidu.com/it/u=4087057811,445331467&fm=26&fmt=auto&gp=0.jpg',
              'https://img2.baidu.com/it/u=4087057811,445331467&fm=26&fmt=auto&gp=0.jpg',
              'https://img2.baidu.com/it/u=4087057811,445331467&fm=26&fmt=auto&gp=0.jpg',
              'https://img2.baidu.com/it/u=4087057811,445331467&fm=26&fmt=auto&gp=0.jpg'
            ]
          },
          // 新增字段，排行榜入口文案
          leader_rank_text: '我邀请了1人，在北京大区排行100+',
          rank_list: [
            {
              name: '张师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/13.png',
              cur_rank: 20,
              follower_cnt: 80
            },
            {
              name: '师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 21,
              follower_cnt: 81
            },
            {
              name: '张师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 20,
              follower_cnt: 80
            },
            {
              name: '师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 21,
              follower_cnt: 81
            },
            {
              name: '张师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 20,
              follower_cnt: 80
            },
            {
              name: '师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 21,
              follower_cnt: 81
            },
            {
              name: '张师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 20,
              follower_cnt: 80
            },
            {
              name: '师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 21,
              follower_cnt: 81
            },
            {
              name: '张师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 20,
              follower_cnt: 80
            },
            {
              name: '师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 21,
              follower_cnt: 81
            },
            {
              name: '师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 21,
              follower_cnt: 81
            },
            {
              name: '张师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 20,
              follower_cnt: 80
            },
            {
              name: '师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 21,
              follower_cnt: 81
            },
            {
              name: '张师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 20,
              follower_cnt: 80
            },
            {
              name: '师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 21,
              follower_cnt: 81
            },
            {
              name: '张师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 20,
              follower_cnt: 80
            },
            {
              name: '师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 21,
              follower_cnt: 81
            },
            {
              name: '张师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 20,
              follower_cnt: 80
            },
            {
              name: '师傅',
              avatar:
                'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
              cur_rank: 21,
              follower_cnt: 81
            }
          ],
          leader_rank: {
            // 个人信息
            name: '张傅',
            avatar:
              'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
            raking: 21,
            follower_cnt: 81 // 邀请总人数
          },
          strategy: {
            title: '奖励金额=(活跃司机流水*1.5%)+(回归司机流水*6%)',
            texts: [
              {
                text: '1.邀请回归司机的比例为6%，邀请活跃司机的比例为1.5%；',
                classname: ''
              },
              {
                text:
                  '司机身份定义：以司机预约活动前30天的完单行为为准（不含预约当天）30天内有完单为活跃司机，无完单为回归司机',
                classname: 'highlight'
              },
              {
                text: '2.需要邀请两名及两名以上司机才可获得好友奖励；',
                classname: ''
              },
              {
                text:
                  '3.需9月30日-10月1日当天出车，才可获得基于好友当日流水的奖励。',
                classname: ''
              }
            ]
          }
        }
      },
      pop: {
        cid: 'DriverNationalPopComponent',
        material: null,
        data: [
          {
            action: 0,
            type: '1',
            status: 0,
            context: {
              button_desc: '喊好友一起预约',
              dialog_title: '自己出车 奖励你',
              tip: '单单涨{2.5}%',
              // tip: '{210.00}元',
              desc: '预约12.31-1.1出车',
              sub_desc: '流水单单涨'
            }
          },
          {
            action: 0,
            type: '1',
            status: 0,
            content: {
              button_desc: '喊好友一起预约',
              dialog_title: '好友跑车 你拿钱',
              tip: '单单涨{2}%',
              desc: '预约12.31-1.1出车',
              sub_desc: '流水单单涨'
            }
          }
        ]
      },
      relation: {
        // 我的邀请列表
        cid: 'DriverNationalRelationComponent',
        material: {},
        data: {
          instance: {
            instance_id: '2aa10f6aa2d2e28773205ff38d6ff6bf0000lwe1',
            status: 1,
            expire_time: '2021-08-22T19:31:36.367758717+08:00'
          },
          groups: [
            {
              followers: [
                {
                  follower_user_name: '张师傅',
                  follower_uid: 1,
                  follower_logo:
                    'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
                  personal: {
                    rate: '国庆出车流水的{%2}给你现金奖励',
                    status: 1
                  }
                },
                {
                  follower_user_name: '李傅',
                  follower_uid: 2,
                  follower_logo:
                    'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
                  personal: {
                    rate: '国庆出车流水的{%5}给你现金奖励',
                    status: 0
                  }
                },
                {
                  follower_user_name: '张师傅',
                  follower_uid: 3,
                  follower_logo:
                    'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
                  personal: {
                    rate: '国庆出车流水的{%2}给你现金奖励',
                    status: 1
                  }
                },
                {
                  follower_user_name: '李傅',
                  follower_uid: 4,
                  follower_logo:
                    'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
                  personal: {
                    rate: '国庆出车流水的{%5}给你现金奖励',
                    status: 0
                  }
                },
                {
                  follower_user_name: '张师傅',
                  follower_uid: 5,
                  follower_logo:
                    'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
                  personal: {
                    rate: '国庆出车流水的{%2}给你现金奖励',
                    status: 1
                  }
                },
                {
                  follower_user_name: '李傅',
                  follower_uid: 6,
                  follower_logo:
                    'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
                  personal: {
                    rate: '国庆出车流水的{%5}给你现金奖励',
                    status: 0
                  }
                },
                {
                  follower_user_name: '张师傅',
                  follower_uid: 7,
                  follower_logo:
                    'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
                  personal: {
                    rate: '国庆出车流水的{%2}给你现金奖励',
                    status: 1
                  }
                },
                {
                  follower_user_name: '李傅',
                  follower_uid: 8,
                  follower_logo:
                    'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
                  personal: {
                    rate: '国庆出车流水的{%5}给你现金奖励',
                    status: 0
                  }
                }
              ],
              status: 1
            }
          ]
        }
      },
      reward: {
        cid: 'DriverNationalRewardComponent',
        material: {},
        data: {
          follower_avatar: [
            'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
            'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
            'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png',
            'https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png'
          ],
          follower_avatar_length: 555,
          assist_reward: 35, // 好友出车的奖励
          personal_reward: 20, // 自己的出车获得的奖励
          total_reward: 200,
          have_follower: true, // --00
          bottom_tip: '昨日出车流水涨300.00元，好友出车奖励现金300.00元',
          today_up_tip: '提升比例34%',
          reward_tip_left: '今日流水已涨',
          reward_tip_right: '今日好友邀约奖励',
          reward_tip_bottom: '最终获奖金额以活动结束后计算为准实时数据仅供参考',
          result: '2021.10.5前发放于“滴滴车主APP-流水”' // 若有
        }
      },
      recommend: {
        // 新增字段，司机评论轮播
       /*  driver_comment_list: [
          {
            avatar: 'https://...',
            comment: '上次参加了跑跑预约礼，比加速卡赚的都多'
          }
        ] */
      },
      share: {
        cid: 'DriverNationalShareComponent',
        material: {},
        data: {
          // "instance": {
          //   "dsi": "11110f6aa2d2e28773205ff38d6ff6bf0000lwe1",
          //   "instance_id": "11110f6aa2d2e28773205ff38d6ff6bf0000lwe1"
          // },
          info: {
            title: '元旦出车奖励限时预约',
            content: '12.31-1.1出车享额外流水加倍，先到先得！'
          },
          poster: {
            poster_url:
              'https://dpubstatic.udache.com/static/anything/toggle/painter/base/162911047395667d5b4d9b45e8b33e8fd3ee52f07d',
            mini_url: ''
          },
          password: null
        }
      },
      toast: {
        cid: 'DefaultToastComponent',
        material: {},
        data: []
      }
    }
  }
}
