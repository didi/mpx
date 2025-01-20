<template>
<!-- style="background: #f5f5f5;" -->
  <div style="position: relative; overflow: hidden; min-width: 950px; background: #f5f5f5;">
    <div class="one-section__img1"></div>
    <div class="one-section__img2"></div>
    <!-- 第一部分 -->
    <section class="one-section">
      <div class="one-section__inner one-section__content">
        <div style="display: inline-block;">
          <h2 class="one-section__title">{{$frontmatter.heroText}}</h2>
          <p class="one-section__desc">
            {{$frontmatter.tagline}}
          </p>
          <button class="one-section__btn one-section__enter">
            <a class="white-link" :href="$frontmatter.actionLink">
              {{$frontmatter.actionText}}
            </a>
          </button>
          <button class="one-section__btn one-section__github">
            <a class="blue-link" :href="$frontmatter.githubLink" target="_blank">
              {{$frontmatter.githubText}}
            </a>
          </button>
        </div>
      </div>
      <div class="one-section__inner"></div>
    </section>

    <!-- 第二部分 -->
    <section class="two-section">
      <ul class="row">
        <li class="two-section__item" v-for="(item, index) in $frontmatter.features" :key="index">
          <img :src="item.icon" alt="svg" loading="lazy" width="80" style="height: 80px;display: inline-block;" />
          <p class="two-section__title">{{item.title}}</p>
          <p class="two-section__desc">{{item.details}}</p>
          <div class="two-section__line"></div>
        </li>
      </ul>
    </section>

    <!-- 第三部分 -->
    <section class="three-section" :style="{ backgroundImage: `url(${$frontmatter.threeSection.bg})` }">
      <div class="three-section__inner">
        <div>
          <div class="three-section__todo">
            <div class="three-section__phone">
              <img
                  width="410"
                  style="height: 712px;max-width: none;"
                  src="https://dpubstatic.udache.com/static/dpubimg/Vx5n_3YCtP/anli_pic_phone.png"
                  alt="phone"
                  loading="lazy" />
            </div>
            <div class="three-section__iframe">
              <iframe
                  title="todo示例"
                  scrolling="no"
                  width="325"
                  height="617"
                  src="https://gift-static.hongyibo.com.cn/static/kfpub/3547/index.html"
                  frameborder="0">
              </iframe>
            </div>
          </div>
        </div>
        <div class="three-section__mvc">
          <div>
            <span class="dot-inner" style="background: #fff; margin: 0 auto;"></span>
            <p class="white-text title">{{$frontmatter.threeSection.title}}</p>
            <p class="white-text desc" >
              <!-- {{$frontmatter.threeSection.details}} -->
              扫码体验 Mpx 版本的
              <a class="target-link" href="https://github.com/didi/mpx/tree/master/examples/mpx-todoMVC">todoMVC</a>
              在各个小程序平台和 web 中的一致表现 ，更多示例项目可点击
              <a class="target-link" href="https://github.com/didi/mpx/tree/master/examples">这里</a>
              进入查看。
            </p>
          </div>
          <!-- <button class="three-section__btn btn">
            <a :href="$frontmatter.threeSection.actionLink" class="blue-link">
              {{$frontmatter.threeSection.actionText}}
            </a>
          </button> -->
          <code-list :dataList="mvcList"></code-list>
        </div>
      </div>
    </section>

    <!-- 第四部分 -->
    <section class="section four-section">
      <div class="grow four-section__bg" :style="{ backgroundImage: `url(${$frontmatter.fourSection && $frontmatter.fourSection.bg})` }">
      </div>
      <div class="four-section__inner">
        <div class="grow" style="position: relative;">
          <img
          width="412"
          :src="$frontmatter.fourSection && $frontmatter.fourSection.img"
          alt="svg"
          loading="lazy" />
        </div>
        <div class="four-section__text grow">
          <div style="margin-left: 86px;">
            <div>
              <span class="dot-inner"></span>
              <p class="title">{{$frontmatter.fourSection && $frontmatter.fourSection.title}}</p>
              <p class="desc">
                {{$frontmatter.fourSection.details}}
              </p>
            </div>
            <button class="btn">
              <a :href="$frontmatter.fourSection.actionLink" class="white-link">
                {{$frontmatter.fourSection.actionText}}
              </a>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 第五部分 -->
    <section class="section five-section">
      <div class="grow five-section__bg" :style="{ backgroundImage: `url(${$frontmatter.fiveSection.bg})` }">
      </div>
      <div class="five-section__inner">
        <div class="five-section__text grow">
          <div style="margin-right: 86px;">
            <div>
              <span class="dot-inner"></span>
              <p class="title">{{$frontmatter.fiveSection.title}}</p>
              <p class="desc">
                {{$frontmatter.fiveSection.details}}
              </p>
            </div>
            <button class="btn">
              <a :href="$frontmatter.fiveSection.actionLink"  class="white-link">
                {{$frontmatter.fiveSection.actionText}}
              </a>
            </button>
          </div>
        </div>
        <div class="grow" style="position: relative; display: flex; justify-content: flex-end;">
          <img
            width="412"
            :src="$frontmatter.fiveSection.img"
            alt="svg"
            loading="lazy" />
        </div>
      </div>

    </section>

    <!-- 第六部分 -->
    <section class="six-section" :style="{ backgroundImage: `url(${$frontmatter.sixSection.bg})` }">
      <div class="six-section__inner">
        <div style="text-align: center;">
          <span class="dot-inner" style="background: #fff; margin: 0 auto;"></span>
        </div>
        <p class="title six-section__title">{{$frontmatter.sixSection.title}}</p>
        <ul class="row six-section__row" v-for="(current, index) in list" :key="index">
          <li v-for="(item, index) in current" :key="index">
            <a :href="item.actionLink" class="six-section__item six-section__step">
              <div class="six-section__icon">
                <img :src="item.icon" alt="svg" loading="lazy" width="50" style="height: 50px;" />
              </div>
              <div class="six-section__list">
                <div class="six-section__bold">{{item.title}}</div>
                <div>{{item.details}}</div>
              </div>
            </a>
          </li>
        </ul>
      </div>
    </section>

    <!-- 第七部分 -->
    <section class="seven-section">
      <span class="dot-inner"></span>
      <p class="title">{{$frontmatter.sevenSection.title}}</p>
      <div class="row seven-section__wrap">
        <div class="grow">
          <p class="seven-section__title">
            {{currentTitle}}
          </p>
          <p class="seven-section__desc">
          </p>
        </div>
        <div class="grow seven-section__center" :style="{ backgroundImage: `url(${$frontmatter.sevenSection.bg})` }">
          <div class="seven-section_phone">
            <img
              width="213"
              style="height: 433px;"
              src="https://dpubstatic.udache.com/static/dpubimg/Vx5n_3YCtP/anli_pic_phone.png"
              alt="phone"
              loading="lazy" />
          </div>
          <div class="seven-section__inner">
            <swiper-img :dataList="dataList" :currentIndex="currentIndex"></swiper-img>
          </div>
        </div>
        <div class="grow"></div>
      </div>
      <swiper :dataList="dataList" @change="handleChange"></swiper>
    </section>
  </div>
</template>

<script>
import Swiper from '../components/Swiper.vue';
import SwiperImg from '../components/SwiperImg.vue';
import CodeList from '../components/CodeList.vue';

export default {
  data () {
    return {
      currentIndex: 0
    }
  },
  computed: {
    list () {
      let result = []
      let details = this.$frontmatter.sixSection.details
      let current = []
      let i = 0
      while (i < details.length) {
        if (i % 3 === 0) {
          current = []
          result.push(current)
        }
        current.push(details[i])
        i++
      }
      return result
    },
    mvcList () {
      return this.$frontmatter.threeSection.list
    },
    dataList () {
      return this.$frontmatter.sevenSection.details
    },
    currentTitle () {
      return this.dataList[this.currentIndex].title
    }
  },
  components: {
    Swiper,
    SwiperImg,
    CodeList
  },
  methods: {
    handleChange (index) {
      this.currentIndex = index
    }
  }
}
</script>

<style lang="stylus" scoped>
ul li
  list-style none
section
  position relative
  z-index 2
.row
  display flex
  align-items center

.header
  padding 40px 0 0 30px
  position relative

.title
  font-size 30px
  margin-top 40px
  margin-bottom 20px
  font-weight 500

.desc
  font-size 14px
  line-height 22px
  margin-top 30px
  margin-bottom 40px

.btn
  width 116px
  height 40px
  background-image linear-gradient(-58deg, #50be97 30%, #31bc7f 79%)
  box-shadow -3px 12px 35px 0 rgba(49, 188, 127, 0.2)
  border-radius 4px
  border none
  font-size 14px

.one-section__content
  display flex
  justify-content flex-end
  // padding 0 200px

.one-section
  padding-top 181px
  position relative
  display flex
  // background url("https://dpubstatic.udache.com/static/dpubimg/tKlPfygfIM/banner_bg.png") no-repeat top right
  // background-size auto 100%

.one-section__img1
  position absolute
  top 0
  left 45%
  width 100%
  height 100%
  background url("https://gift-static.hongyibo.com.cn/static/kfpub/3547/banner_bg_v3.png") no-repeat top left
  background-size auto 680px

.one-section__img2
  position absolute
  top 20
  left 53%
  width 100%
  height 100%
  background url("https://gift-static.hongyibo.com.cn/static/kfpub/3547/banner_pic_v3.png") no-repeat top left
  background-size auto 550px

.one-section__inner
  flex 1

.one-section__title
  margin-top 30px
  margin-bottom 20px
  font-size 40px
  font-weight 500
  border-bottom none

.one-section__desc
  width 450px
  line-height 30px
  margin-bottom 70px
  padding-top 20px

.one-section__btn
  width 162px
  height 52px
  border-radius 4px
  border none
  font-size 20px

.one-section__enter
  background-image linear-gradient(-58deg, #50be97 30%, #31bc7f 79%)
  box-shadow -3px 12px 35px 0 rgba(49, 188, 127, 0.2)

.one-section__github
  margin-left 30px
  background #ffffff
  border 0 solid #efefef
  box-shadow -3px 12px 35px 0 rgba(49, 188, 127, 0.2)

.white-link
  color #ffffff
  font-weight 600
  display flex
  align-items center
  justify-content center

.blue-link
  color #31bc7f
  font-weight 600
  width 100%
  height 100%
  display flex
  align-items center
  justify-content center

.target-link
  color #ffffff
  font-weight 600
  text-decoration underline

.two-section
  padding-top 240px
  display flex
  justify-content center

.two-section__item
  width 280px
  // height 344px
  padding 40px 18px 40px 18px
  box-sizing border-box
  background #ffffff
  border 0 solid #efefef
  box-shadow 0 51px 145px 0 rgba(49, 188, 127, 0.1), 0 11px 32px 0 rgba(49, 188, 127, 0.06), 0 3px 10px 0 rgba(49, 188, 127, 0.04)
  border-radius 4px
  margin 0 10px
  text-align center
  list-style none
  position relative
  overflow hidden


.two-section__item:nth-child(2)
  position relative
  top 54px

.two-section__line
  height 8px
  width 100%
  position absolute
  left 0
  bottom 0
  opacity 0.6
  background-image linear-gradient(-58deg, #50BE97 30%, #31BC7F 79%)

.two-section__title
  font-size 20px
  margin 33px 0 21px 0

.two-section__desc
  font-size 14px
  line-height 22px


.three-section
  margin-top 183px
  display flex
  background-repeat no-repeat
  background-size auto 100%
  background-position center center
  height 713px
  align-items center
  // padding 0 24px
  position relative

.three-section__inner
  width 1190px
  margin 0 auto
  display flex
  align-items center
  box-sizing border-box
  padding 0 40px

.three-section__mvc
  margin-left 60px

.three-section__todo
  position relative

.three-section__phone
  position absolute
  left 0
  top 0

.three-section__iframe
  display flex
  align-items center
  justify-content center
  position relative
  // display inline-block
  width 375px
  height 672px
  left 20px
  top 20px
  border-radius 44px
  background #fff
  overflow hidden
  box-shadow 0 80px 252px 0 rgba(49,188,127,0.12), 0 36px 76px 0 rgba(49,188,127,0.08), 0 15px 31px 0 rgba(49,188,127,0.06), 0 5px 11px 0 rgba(49,188,127,0.04)

.iframe_wrapper
  width 375px
  height 672px
  display flex
  justify-content center
  align-items center

.white-text
  color #fff

.three-section__btn
  background #fff

.section
  display flex
  align-items center
  height 520px
  box-sizing border-box
  margin-top 183px
  position relative
  justify-content center

.grow
  flex 1

.four-section
  // width 1190px

.four-section__bg
  background-repeat no-repeat
  background-size auto 600px
  height 600px
  width 100%
  text-align center
  position absolute
  right 50%
  background-position top right

.four-section__text
  // box-sizing border-box
  // padding 0 24px 0 85px

.four-section__inner
  display flex
  width 1190px
  align-items center
  padding 0 40px
  box-sizing border-box

.five-section__bg
  background-repeat no-repeat
  background-size auto 600px
  height 600px
  width 100%
  text-align center
  position absolute
  left 50%
  background-position top left

.five-section__text
  // padding 0 85px 0 24px
  // max-width 550px

.five-section__inner
  display flex
  width 1190px
  align-items center
  padding 0 40px
  box-sizing border-box

.six-section
  margin-top 140px
  display flex
  align-items center
  justify-content center
  background-repeat no-repeat
  background-size auto 100%
  background-position center center
  height 694px

.six-section__inner
  margin-bottom 50px

.six-section__item
  background #ffffff
  border 0 solid #a4a4a4
  border-radius 4px
  width 290px
  height 80px
  display flex
  padding 17px 0 17px 17px
  box-sizing border-box

.six-section__step
  margin-right 20px

.six-section__row
  margin-bottom 20px
  flex-wrap: wrap;
  justify-content: center;

.six-section__list
  display flex
  flex-direction column
  justify-content space-between
  font-size 14px
  color #3A495D

.six-section__bold
  font-size 16px
  font-weight 500
  white-space nowrap

.six-section__title
  margin-bottom 50px
  text-align center
  color #ffffff

.six-section__icon
  margin-right 9px

.seven-section
  margin-top 113px
  text-align center
  background #f5f5f5

.seven-section__center
  width 402px
  height 100%
  background-repeat no-repeat
  background-size contain
  background-position center
  display flex
  justify-content center
  position relative

.seven-section__inner
  padding 14px
  box-shadow 0 43px 86px 0 rgba(49,188,127,0.07), 0 7px 21px 0 rgba(49,188,127,0.04), 0 2px 6px 0 rgba(49,188,127,0.03)
  border-radius 30px

.seven-section__wrap
  height 433px
  margin-top 40px
  margin-bottom 40px

.seven-section_phone
  position absolute
  top 0
  left 50%
  transform translate3d(-50%, 0, 0)

.seven-section__title
  text-align right
  font-size 20px
  font-weight 600

.seven-section__desc
  margin-top 41px
  text-align left
  font-size 14px
  line-height 23px

.dot
  width 100%

.dot-inner
  background #31BC7F
  border-radius 4px
  width 34px
  height 10px
  display inline-block
</style>
