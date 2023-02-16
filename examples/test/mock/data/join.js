/* eslint-disable */
const STATUS_MAP = {
  not_join: 'not-join',
  join_not_start: 'join-not-start',
  share_work: 'share-work', // 喊好友出车
  work_slef: 'work-self', // 未邀请到2名好友，单行
  work: 'work', // 立即出车 双列 邀请到了2名好友
  ing_reward: 'ing-reward', // 显示昨日流水 单行
  ing_reward_friends: 'ing-reward-friends', // 显示昨日流水 双行
  result: 'result'
}
export default {
  "errno": 0,
  "errmsg": "success",
  "traceid": "ac19993260f95716ea50e652658221b0",
  "page": "leaderPage",
  "action": "",
  "data": {
    "activity": {
      "cid": "DriverNationalActivityComponentID",
      "material": {},
      "data": {
        "uid": 6666,
        "actual": 0,
        "act_id": 2345,
        "city_list": null,
        "xid": 2021,
        "start_time": "2021-09-30 16:57:33",
        "end_time": "2021-10-01 16:57:33",
        "count_down_mills": 2064355600,
        "user_status": STATUS_MAP.join_not_start,
        "out_title": "跑跑预约礼",
        "button_desc": '立即预约', // 
        "authorization_desc": "为了提升您的用户体验， 滴滴平台开展“xx”活动。如您希望参与该活动并作为被邀请人并获得相应的奖励，则您的个人信息（以下简称“授权信息”），具体包括车主头像、活跃程度、返佣比例、姓名等 ，将提供和共享给邀请人，以便您与邀请人能参与活动并获得相应奖励。 您授权后，对上述信息进行必要的使用、处理以及共享、储存，滴滴平台严格履行保密义务并遵守《个人信息保护及隐私政策》的规定。 本授权书的授权期限为自您勾选“我已阅读并同意本协议”之日起生效。1",
        "participation": true,
        "driver_out": true, // 当天司机是否出车
        "activity_desc": "预约12.31-1.1出车{额外}享流水加倍",
        "button_bottom_tip": "2021年9月29日邀请结束", // 100万+名司机与你一起报名出车
        "act_out_status": 1,
        "templates": ['zo6n44hldFOqsWFGtAkOcrC-WOgsLgyrncfDd17ehAA'],
        "invitation_title": '邀好友12.31-1.1同出车', // 我的邀请popup 文案
        "invitation_desc": '额外享好友流水奖励', // 我的邀请popup 文案
        "city_name": "北京", // 北京大区邀请排行
        "button_bubble": ["slkdfjlajdkf", '2222', 'cccc', '12333333333333'],
        // "toast_title" : {
        //   "status": 'already-join',
        //   "text": '已预约过活动'
        // },
        // toast_title : {
        // status: 'ing-not-join'，
        // text: '预约已结束，可以参加其他奖励过活动'
        // },
        "main_task_progress": {
          "current_value": "30000", 
          "current_percent": "2",
          "next_percent": "3",
          "all_rights": [
            {
              "number": "0",
              "rate": "1"
            },
            {
              "number": "30000",
              "rate": "1.5"
            },
            {
              "number": "600000",
              "rate": "2"
            },
            {
              "number": "1000000",
              "rate": "3"
            }
          ]
        },
        "main_task_overview": {
          "total_cnt": "600000",
          "avatars": [
            "https://img2.baidu.com/it/u=4087057811,445331467&fm=26&fmt=auto&gp=0.jpg",
            "https://img2.baidu.com/it/u=4087057811,445331467&fm=26&fmt=auto&gp=0.jpg",
            "https://img2.baidu.com/it/u=4087057811,445331467&fm=26&fmt=auto&gp=0.jpg",
            "https://img2.baidu.com/it/u=4087057811,445331467&fm=26&fmt=auto&gp=0.jpg",
            "https://img2.baidu.com/it/u=4087057811,445331467&fm=26&fmt=auto&gp=0.jpg"
          ]
        },
        "rank_list": [
          {
            "name": "张师傅",
            "avatar": "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png",
            "cur_rank": 20,
            "follower_cnt": 80
          },
          {
            "name": "师傅",
            "avatar": "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png",
            "cur_rank": 21,
            "follower_cnt": 81
          }
        ],
        "leader_rank": { // 个人信息
          "name": "张傅",
          "avatar": "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png",
          "raking": 21,
          "follower_cnt": 81 // 邀请总人数
        },
        "strategy": {
          "title": "奖励金额=(活跃司机流水*1.5%)+(回归司机流水*6%)",
          "texts": [
            {
              text: '1.邀请回归司机的比例为6%，邀请活跃司机的比例为1.5%；',
              classname: ''
            },
            {
              text: '司机身份定义：以司机预约活动前30天的完单行为为准（不含预约当天）30天内有完单为活跃司机，无完单为回归司机',
              classname: 'highlight'
            },
            {
              text: '2.需要邀请两名及两名以上司机才可获得好友奖励；',
              classname: ''
            },
            {
              text: '3.需9月30日-10月1日当天出车，才可获得基于好友当日流水的奖励。',
              classname: ''
            }
          ]
        }
      }
    },
    "pop": {
      "cid": "DriverNationalPopComponent",
      "material": null,
      "data": [
        {
          "action": 0,
          "type": "1",
          "status": 0,
          "context": {
            "button_desc": "喊好友一起预约",
            "dialog_title": "预约成功 出车享奖励",
            "tip": "单单涨{2}%",
            "desc": "预约12.31-1.1出车",
            "sub_desc": "流水单单涨",
          }
        },
        {
          "action": 0,
          "type": "1",
          "status": 0,
          "content": {
            "button_desc": "喊好友一起预约",
            "dialog_title": "好友跑车 你拿钱",
            "tip": "单单涨{2}%",
            "desc": "预约12.31-1.1出车",
            "sub_desc": "流水单单涨"
          }
        }
      ]
    },
    "relation": { // 我的邀请列表
      "cid": "DriverNationalRelationComponent",
      "material": {},
      "data": {
        "instance": {
          "instance_id": "2aa10f6aa2d2e28773205ff38d6ff6bf0000lwe1",
          "status": 1,
          "expire_time": "2021-08-22T19:31:36.367758717+08:00"
        },
        "groups": [
          {
            "followers": [
              {
                "follower_user_name": "张师傅",
                "follower_uid": 1,
                "follower_logo": "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png",
                "personal": {
                  "rate": "国庆出车流水的{%2}给你现金奖励",
                  "status": 1
                }
              },
              {
                "follower_user_name": "李傅",
                "follower_uid": 2,
                "follower_logo": "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png",
                "personal": {
                  "rate": "国庆出车流水的{%5}给你现金奖励",
                  "status": 0
                }
              },
              {
                "follower_user_name": "张师傅",
                "follower_logo": "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png",
                "personal": {
                  "rate": "国庆出车流水的{%2}给你现金奖励",
                  "status": 1
                }
              },
              {
                "follower_user_name": "李傅",
                "follower_logo": "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png",
                "personal": {
                  "rate": "国庆出车流水的{%5}给你现金奖励",
                  "status": 0
                }
              },
              {
                "follower_user_name": "张师傅",
                "follower_logo": "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png",
                "personal": {
                  "rate": "国庆出车流水的{%2}给你现金奖励",
                  "status": 1
                }
              },
              {
                "follower_user_name": "李傅",
                "follower_logo": "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png",
                "personal": {
                  "rate": "国庆出车流水的{%5}给你现金奖励",
                  "status": 0
                }
              },
              {
                "follower_user_name": "张师傅",
                "follower_logo": "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png",
                "personal": {
                  "rate": "国庆出车流水的{%2}给你现金奖励",
                  "status": 1
                }
              },
              {
                "follower_user_name": "李傅",
                "follower_logo": "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png",
                "personal": {
                  "rate": "国庆出车流水的{%5}给你现金奖励",
                  "status": 0
                }
              }
            ],
            "status": 1
          }
        ]
      }
    },
    "reward": {
      "cid": "DriverNationalRewardComponent",
      "material": {},
      "data": {
        "follower_avatar": [
          "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png",
          "https://dpubstatic.udache.com/static/dpubimg/W-ri_D7Tzh/123.png"
        ],
        "follower_avatar_length": 555,
        "assist_reward": 35, // 好友出车的奖励
        "personal_reward": 20, // 自己的出车获得的奖励
        "total_reward": 200,
        "have_follower": false, // --00
        "bottom_tip": "昨日出车流水涨300.00元，好友出车奖励现金300.00元",
        "today_up_tip": "提升比例34%",
        "reward_tip_left": "今日流水已涨",
        "reward_tip_right": "今日好友邀约奖励",
        "reward_tip_bottom": "最终获奖金额以活动结束后计算为准实时数据仅供参考", // result: 2021.10.5前发放于“滴滴车主APP-流水”
      }
    },
    "share": {
      "cid": "DriverNationalShareComponent",
      "material": {},
      "data": {
        "instance": {
          "dsi": "22222aa10f6aa2d2e28773205ff38d6ff6bf0lwe1",
          "instance_id": "22222aa10f6aa2d2e28773205ff38d6ff6bf0lwe1"
        },
        "info": {
          "title": "元旦出车奖励限时预约",
          "content": "12.31-1.1出车享额外流水加倍，先到先得！"
        },
        "poster": {
          "poster_url": "https://dpubstatic.udache.com/static/anything/toggle/painter/base/162911047395667d5b4d9b45e8b33e8fd3ee52f07d",
          "mini_url": ""
        },
        "password": null
      },
    },
    "toast": {
      "cid": "DefaultToastComponent",
      "material": {},
      "data": []
    }
  }
}
