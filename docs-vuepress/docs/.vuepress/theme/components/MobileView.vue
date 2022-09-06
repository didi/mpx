<template>
  <div class="m-banner-wrapper">
    <div class="m-banner">
      <div class="m-title">{{ $page.frontmatter.heroText }}</div>
      <div class="m-subtitle">
        {{ $page.frontmatter.tagline }}
      </div>

      <div class="m-banner-btn-wrapper">
        <button class="m-banner-btn m-banner-btn-enter">
          <a style="font-size: 15px;" :href="$page.frontmatter.actionLink">
            {{ $page.frontmatter.actionText }}
          </a>
        </button>
        <div class="m-banner-btn m-banner-btn-jump">
          <a class="white-link" :href="$page.frontmatter.githubLink">
            {{ $page.frontmatter.githubText }}
          </a>
        </div>
      </div>
      <div class="m-banner-bg"></div>
    </div>

    <div class="m-advantages">
      <li
        class="m-advan-section"
        v-for="(item, index) in $page.frontmatter.features"
        :key="index"
      >
        <img
          class="m-advan-section-img"
          :src="item.micon"
          loading="lazy"
          width="34"
          height="34"
        />
        <p class="m-advan-section-title">{{ item.title }}</p>
      </li>
    </div>

    <div class="mdemo-wrapper">
      <div class="mdemo-title">{{ $page.frontmatter.threeSection.title }}</div>
      <p class="mdemo-subtitle">
        扫码体验Mpx版本的
        <a class="target-link" href="https://github.com/didi/mpx/tree/master/examples/mpx-todoMVC">todoMVC</a>
        在各个小程序平台和web中的一致表现 ，更多示例项目可点击
        <a class="target-link" href="https://github.com/didi/mpx/tree/master/examples">这里</a>
        进入查看。
      </p>
      <!-- <a class="mdemo-btn" href="/">
        {{ $page.frontmatter.threeSection.actionText }}
      </a> -->
      <div class="mdemo-icon-wrapper">
        <div style="margin: 0 6px;" v-for="(item, index) in mvcList" :key="index">
          <img width="130" height="150" :src="item.code" alt="code" loading="lazy" />
        </div>
      </div>
    </div>

    <div class="m-feature-wrapper">
      <div class="m-feature-title">
        {{ $page.frontmatter.fourSection.title }}
      </div>
      <div class="m-feature-subtitle">
        {{ $page.frontmatter.fourSection.details }}
      </div>
      <a class="m-feature-btn" :href="$page.frontmatter.fourSection.actionLink">
        {{ $page.frontmatter.fourSection.actionText }}
      </a>
      <img
        class="m-feature-pic"
        width="100%"
        height="309px"
        :src="$page.frontmatter.fourSection.mimg"
        alt="platform"
        loading="lazy"
      />

      <div class="m-feature-title">
        {{ $page.frontmatter.fiveSection.title }}
      </div>
      <div class="m-feature-subtitle">
        {{ $page.frontmatter.fiveSection.details }}
      </div>
      <a class="m-feature-btn" :href="$page.frontmatter.fourSection.actionLink">
        {{ $page.frontmatter.fiveSection.actionText }}
      </a>
      <img
        class="m-feature-pic"
        width="100%"
        height="309px"
        :src="$page.frontmatter.fiveSection.mimg"
        alt="platform"
        loading="lazy"
      />
    </div>

    <div class="m-util-wrapper">
      <div class="m-util-title">{{$page.frontmatter.sixSection.title}}</div>
      <ul class="row six-section__row" v-for="(item, index) in list" :key="index">
        <a :href="item.actionLink" class="six-section__item six-section__step">
          <img class="six-section__icon" :src="item.icon" alt="svg" loading="lazy" width="50" height="50" />
          <div class="six-section__list">
            <div class="six-section__bold">{{item.title}}</div>
            <div class="six-section__subtitle">{{item.details}}</div>
          </div>
        </a>
      </ul>
    </div>

    <div class="m-example-wrapper">
      <div class="m-example-title">{{$page.frontmatter.sevenSection.title}}</div>
        <div class="m-example-phone">
          <img
              width="318"
              height="318"
              src="https://dpubstatic.udache.com/static/dpubimg/xxjYvzgJdt/y_bg_phone.png"
              alt="phone"/>
          <div class="m-example-img-contain">
            <mobile-swiper ref="multiImg" :height="390" :dataList="dataList" @change="handleChange">
              <template v-slot="slotProps">
                <div class="m-example-swiper">
                  <img style="border-radius: 20px;" width="180" :src="slotProps.item.demo" alt="demo">
                </div>
              </template>
            </mobile-swiper>
          </div>
        </div>
        <mobile-swiper :height="200" :dot="true" @change="handlePage" :autoPlay="false" :dataList="multiList" ref="multiPage">
          <template v-slot="slotProps">
            <div class="m-example-swiper">
              <div :class="{ active: currentIndex === index }" class="m-example-name"  v-for="(current, index) in slotProps.item" :key="index" @click="handleSelect(index)">
                {{current.title}}
              </div>
            </div>
          </template>
        </mobile-swiper>
    </div>
  </div>
</template>

<script>
import MobileSwiper from "./MobileSwiper.vue"

export default {
  components: {
    MobileSwiper
  },
  data() {
    return {
      currentIndex: 0,
      pageIndex: 0,
      tempIndex: 0
    }
  },
  computed: {
    list () {
      return this.$page.frontmatter.sixSection.details
    },
    multiList () {
      const list = this.$page.frontmatter.sevenSection.details
      const result = []
      let temp = []
      for (let i = 0; i < list.length; i++) {
        if (i % 4 === 0) {
          if (temp.length) result.push(temp)
          temp = []
        }
        temp.push(list[i])
      }
      if (temp.length) result.push(temp)
      return result
    },
    mvcList() {
      const list = this.$page.frontmatter.threeSection.list
      return list
    },
    dataList () {
      const list = this.$page.frontmatter.sevenSection.details
      return list
    }
  },
  methods: {
    handleChange (index) {
      if (index > 3) {
        this.currentIndex = index % 4
      } else {
        this.currentIndex = index
      }
      if (index > 2) {
        if (index % 4 === 0 && index > this.tempIndex) {
          this.$refs.multiPage.handleNext('off')
          this.currentIndex = 0
        }
        if ((index + 1) % 4 === 0 && index < this.tempIndex) {
          this.$refs.multiPage.handlePrev('off')
          this.currentIndex = 3
        }
      }
      this.tempIndex = index
    },
    handleSelect (index) {
      let num = this.pageIndex * 4 + index
      this.tempIndex = num
      this.currentIndex = index
      this.$refs.multiImg.handleSelect(num)
    },
    handlePage (index) {
      this.pageIndex = index
      this.handleSelect(0)
    }
  }
};
</script>

<style lang="stylus" scoped>
.active {
  border: 2px solid #00BD81 !important;
}
.m-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 468px;
  background-image: linear-gradient(0deg, #50BE97 4%, #31BC7F 83%);

  .m-title {
    font-family: PingFangSC-Medium;
    font-size: 26px;
    color: #FFFFFF;
    letter-spacing: 0;
    text-align: justify;
    font-weight: 500;
    margin-top: 120px;
  }

  .m-subtitle {
    font-family: PingFangSC-Regular;
    font-size: 13px;
    color: #FFFFFF;
    letter-spacing: 0;
    text-align: center;
    line-height: 22px;
    font-weight: 400;
    margin: 10px 30px 0;
  }

  .m-banner-btn-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-content: center;
    padding-top: 30px;

    .m-banner-btn {
      width: 104px;
      height: 36px;
      border-radius: 4px;
      text-align: center;
      line-height: 36px;
    }

    .m-banner-btn-enter {
      background: #FFFFFF;
      border: 0 solid #EFEFEF;
      margin-right: 15px;
    }

    .m-banner-btn-jump {
      border: 1px solid #FFFFFF;
      margin-left: 15px;
      color: #fff;
      box-sizing: border-box;
    }

    .white-link {
      color: #fff;
    }
  }

  .m-banner-bg {
    width: 375px;
    height: 202px;
    background-image: url('https://dpubstatic.udache.com/static/dpubimg/A0HNx-AsoO/y_pic_banner.png');
    background-size: cover;
    margin-top: 35px;
  }
}

.m-advantages {
  display: flex;
  justify-content: space-between;
  align-items: center;
  // height 118px
  padding: 20px 16px;
  background: #FFFFFF;

  .m-advan-section {
    width: 100px;
    height: 78px;
    background: #FFFFFF;
    box-shadow: 0 11px 32px 0 rgba(49, 188, 127, 0.06), 0 3px 10px 0 rgba(49, 188, 127, 0.04);
    border-radius: 4px;
    text-align: center;
    list-style: none;

    .m-advan-section-img {
      margin-top: 10px;
    }

    .m-advan-section-title {
      margin-top: 4px;
      font-family: PingFangSC-Regular;
      font-size: 15px;
      color: #3A495D;
      letter-spacing: 0;
      text-align: center;
      line-height: 22px;
      font-weight: 400;
    }
  }
}

.m-example-swiper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
}

.m-example-name {
  width: 166px;
  height: 60px;
  margin: 6px;
  border: 2px solid #EDEDED;
  box-shadow: 0 11px 32px 0 rgba(49,188,127,0.06), 0 4px 10px 0 rgba(49,188,127,0.04);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
}

.mdemo-wrapper, .m-feature-wrapper, .m-util-wrapper, .m-example-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #F7F7F7;

  .mdemo-title, .m-feature-title, .m-util-title, .m-example-title {
    font-family: PingFangSC-Medium;
    font-size: 24px;
    color: #3A495D;
    letter-spacing: 0;
    text-align: justify;
    font-weight: 500;
    margin-top: 50px;
    margin-bottom: 20px;
  }

  .mdemo-subtitle, .m-feature-subtitle {
    font-family: PingFangSC-Regular;
    font-size: 13px;
    color: #394E5E;
    letter-spacing: 0;
    text-align: center;
    line-height: 22px;
    font-weight: 400;
    padding 0 30px
  }

  .mdemo-btn, .m-feature-btn {
    width: 104px;
    height: 36px;
    background: #00BD81;
    border: 0 solid #EFEFEF;
    border-radius: 4px;
    margin-top: 30px;
    font-family: PingFangSC-Medium;
    font-size: 15px;
    color: #FFFFFF;
    letter-spacing: 0;
    text-align: center;
    line-height: 36px;
    font-weight: 500;
  }

  .mdemo-icon-wrapper {
    margin: 10px 0 40px 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-items: center;
    align-content: space-around;

    .mdemo-icon-card {
      width: 100px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin-top: 30px;
    }
  }

  .m-feature-pic {
    margin-top: 40px;
  }

  .six-section__row {
    margin: 0 0 10px 0
    flex-wrap: wrap;
    justify-content: center;
    padding: 0 16px
    width: 100%
    box-sizing: border-box

    .six-section__item {
      display: flex
      align-items: center
      background #ffffff
      border 0 solid #EFEFEF
      border-radius 4px
      height 72px
      display flex
      padding 11px 0 11px 24px
      box-sizing border-box
      box-shadow 0 11px 32px 0 rgba(49,188,127,0.06), 0 4px 10px 0 rgba(49,188,127,0.04)
    }
      .six-section__icon {
        margin-right 9px
      }
      .six-section__list {
        display flex
        flex-direction column
        justify-content space-between
        color #3A495D
        margin-left 10px
        font-family PingFangSC-Medium
      }
      .six-section__bold {
        font-size 15px
        margin-right 9px
        margin-bottom 4px
      }
      .six-section__subtitle {
        font-size 13px
      }
  }

  .m-example-phone {
    width: 100%
    display flex
    justify-content center
    position relative
    height 450px
    align-items center
    .m-example-img-contain {
      position absolute
      top 0
      left 50%
      transform translate3d(-50%, 0, 0)
      width 100%
      width 190px
      height 390px
      background url("https://dpubstatic.udache.com/static/dpubimg/Vx5n_3YCtP/anli_pic_phone.png") no-repeat center center
      background-size contain
      padding 12px
    }
  }
}

.m-feature-wrapper {
  background: #fff;
  padding-bottom: 50px;
}

.m-example-wrapper {
  background: #fff;
}

.m-util-wrapper {
  padding-bottom: 20px;
}
</style>