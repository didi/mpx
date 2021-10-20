<template>
  <div class="m-banner-wrapper">
    <div class="m-banner">
      <div class="m-title">{{ $page.frontmatter.heroText }}</div>
      <div class="m-subtitle">
        {{ $page.frontmatter.tagline }}
      </div>

      <div class="m-banner-btn-wrapper">
        <button class="m-banner-btn m-banner-btn-enter">
          <a class="white-link" :href="$page.frontmatter.actionLink">
            {{ $page.frontmatter.actionText }}
          </a>
        </button>
        <div class="m-banner-btn m-banner-btn-jump">
          <a class="blue-link" :href="$page.frontmatter.githubLink">
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
      <div class="mdemo-subtitle">
        {{ $page.frontmatter.threeSection.mdetails }}
      </div>
      <div class="mdemo-btn">
        {{ $page.frontmatter.threeSection.actionText }}
      </div>
      <div class="mdemo-icon-wrapper">
        <div v-for="(item, index) in mvcList" :key="index">
          <div class="mdemo-icon-card">
            <img
              class="mdemo-icon-img"
              width="60"
              height="60"
              :src="item.icon"
              alt="platform"
              loading="lazy"
            />
            <div class="mdemo-icon-title">{{ item.title }}</div>
          </div>
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
      <div class="m-feature-btn">
        {{ $page.frontmatter.fourSection.actionText }}
      </div>
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
      <div class="m-feature-btn">
        {{ $page.frontmatter.fiveSection.actionText }}
      </div>
      <img
        class="m-feature-pic"
        width="100%"
        height="309px"
        :src="$page.frontmatter.fiveSection.mimg"
        alt="platform"
        loading="lazy"
      />
    </div>
    <swiper-img :dataList="dataList" :currentIndex="currentIndex"></swiper-img>
    <MobileSwiper :dataList="dataList" @change="handleChange"></MobileSwiper>
    <MobileFooter />
  </div>
</template>

<script>
import MobileFooter from "./MobileFooter.vue"
import MobileSwiper from "./MobileSwiper.vue"
import MobileSwiperImg from '../components/SwiperImg.vue'

export default {
    components: {
    MobileSwiper,
    MobileFooter
  },
  data() {
      return {
          // data: document.body.clientWidth < 1020
          currentIndex: 0
      }
  },
  computed: {
    mvcList() {
      const mlist = this.$page.frontmatter.threeSection.mlist;
      return mlist;
    },
    dataList () {
      const list = this.$page.frontmatter.sevenSection.details
      return list
    },
  },
  methods: {
    handleChange (index) {
      this.currentIndex = index
    }
  }
};
</script>

<style lang="stylus">
.m-banner {
  display: flex;
  flex-direction: column;
  // justify-content center
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
    margin-top: 50px;
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
      border: 0 solid #FFFFFF;
      box-shadow: -3px 12px 35px 0 rgba(49, 188, 127, 0.2);
      margin-left: 15px;
      background-color: rgba(0, 0, 0, 0.2);
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

.mdemo-wrapper, .m-feature-wrapper {
  display: flex;
  flex-direction: column;
  // justify-content center
  align-items: center;
//   height: 535px;
  background: #F7F7F7;
  margin-top: 50px;

  .mdemo-title, .m-feature-title {
    font-family: PingFangSC-Medium;
    font-size: 24px;
    color: #3A495D;
    letter-spacing: 0;
    text-align: justify;
    font-weight: 500;
    margin-top: 50px;
  }

  .mdemo-subtitle, .m-feature-subtitle {
    font-family: PingFangSC-Regular;
    font-size: 13px;
    color: #394E5E;
    letter-spacing: 0;
    text-align: center;
    line-height: 22px;
    font-weight: 400;
    margin: 20px 30px 0;
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
    margin: 5px 23px 0;
    display: flex;
    // flex-direction: column;
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
}
</style>