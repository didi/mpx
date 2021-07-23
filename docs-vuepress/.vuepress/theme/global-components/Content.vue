<template>
  <div>
    <!-- 第一部分 -->
    <section class="one-section one-section__content">
      <div>
        <h2 class="one-section__title">增强型跨端小程序框架</h2>
        <p class="one-section__desc">
          良好的开发体验，极致的应用性能，完整的原生兼容，一份源码跨端输出所有小程序平台及Web。
        </p>
        <button class="one-section__btn one-section__enter">
          <a class="white-link" href="/guide/basic/start.html">快速进入</a>
        </button>
        <button class="one-section__btn one-section__github">
          <a class="blue-link" href="https://github.com/didi/mpx">Github</a>
        </button>
      </div>
    </section>

    <!-- 第二部分 -->
    <section class="two-section">
      <ul class="row">
        <li class="two-section__item">
          <img src="../../public/doc-svg/texing_icon_gao.svg" alt="svg" />
          <p class="two-section__title">高性能</p>
          <p class="two-section__desc">
            以增强的方式将Vue中大量优良特性引入到小程序开发中，配合灵活强大的编译构建，大大提升了小程序开发体验和效率，同时提供了媲美原生开发的稳定性。
          </p>
        </li>
        <li class="two-section__item two-section__step">
          <img src="../../public/doc-svg/texing_icon_you.svg" alt="svg" />
          <p class="two-section__title">优体验</p>
          <p class="two-section__desc">
            框架自带深度的运行时性能优化及包体积优化，让开发者在大多数场景下只需专注于业务开发，就能生产出媲美原生的高性能小程序应用。
          </p>
        </li>
        <li class="two-section__item">
          <img src="../../public/doc-svg/texing_icon_kua.svg" alt="svg" />
          <p class="two-section__title">跨平台</p>
          <p class="two-section__desc">
            一份源码，多端运行，Mpx专注解决小程序跨端问题，以静态编译为主要手段，将业务源码输出到微信/支付宝/百度/头条/QQ小程序平台和web环境下运行。
          </p>
        </li>
      </ul>
    </section>

    <!-- 第三部分 -->
    <section class="three-section">
      <div>
        <img
          width="270"
          src="https://dpubstatic.udache.com/static/dpubimg/eCoUSCwEEm/anli_pic_phone.png"
          alt="svg"
        />
      </div>
      <div class="three-section__mvc">
        <div>
          <p class="white-text title">TodoMVC</p>
          <p class="white-text desc">
            示例源码链接示例源码链接示例源码链接示例源码链接示例源码链接示例源码链接示例源码链接示例源码链接示例源码链接示例源码链接示例源码链接示例源码链接示例源码链接示例源码链接示例源码链接示例源码链接。
          </p>
        </div>
        <button class="three-section__btn btn">
          <a href="/guide/basic/start.html" class="blue-link">点击进入</a>
        </button>
      </div>
    </section>

    <!-- 第四部分 -->
    <section class="section">
      <div class="grow four-section__bg">
        <img
          width="412"
          src="https://dpubstatic.udache.com/static/dpubimg/oOWo-JDcm6/jizhi_pic.png"
          alt="svg"
        />
      </div>
      <div class="grow">
        <div class="four-section__text">
          <div>
            <p class="title">极致性能</p>
            <p class="desc">
              在方便使用框架提供的便捷特性的同时，也能享受到媲美原生开发的确定性和稳定性，完全没有框架太多坑，不如用原生的顾虑；不管是增强输出还是跨平台输出，最终的dist代码可读性极强，便于调试排查；
            </p>
          </div>
          <button class="btn">
            <a href="/guide/basic/start.html" class="white-link">点击进入</a>
          </button>
        </div>
      </div>
    </section>

    <!-- 第五部分 -->
    <section class="section">
      <div class="grow">
        <div class="five-section__text">
          <div>
            <p class="title">渐进迁移</p>
            <p class="desc">
              极致的性能：得益于增强的设计思路，Mpx框架在运行时不需要做太多封装抹平转换的工作，框架的运行时部分极为轻量简洁，压缩+gzip后仅占用14KB；配合编译构建进行的包体积优化和基于模板渲染函数进行的数据依赖跟踪，Mpx框架在性能方面做到了业内最优(小程序框架运行时性能评测报告
              (opens new window))；
            </p>
          </div>
          <button class="btn">
            <a href="/guide/basic/start.html" class="white-link">点击进入</a>
          </button>
        </div>
      </div>
      <div class="grow five-section__bg">
        <img
          width="412"
          src="https://dpubstatic.udache.com/static/dpubimg/A1QOOIO0bj/jianjin_pic.png"
          alt="svg"
        />
      </div>
    </section>

    <!-- 第六部分 -->
    <section class="six-section">
      <div>
        <p class="title six-section__title">渐进迁移</p>
        <ul class="row six-section__row">
          <li>
            <a href="" class="six-section__item six-section__step">
              <div class="six-section__icon">
                <img src="../../public/doc-svg/kaifa_icon_2.svg" alt="svg" />
              </div>
              <div class="six-section__list">
                <div>@mpxjs/api-proxy</div>
                <div>运行时核心</div>
              </div>
            </a>
          </li>
          <li>
            <a href="" class="six-section__item six-section__step">
              <div class="six-section__icon">
                <img src="../../public/doc-svg/kaifa_icon_2.svg" alt="svg" />
              </div>
              <div class="six-section__list">
                <div>@mpxjs/webpack-plugin</div>
                <div>编译核心</div>
              </div>
            </a>
          </li>
          <li>
            <a href="" class="six-section__item">
              <div class="six-section__icon">
                <img src="../../public/doc-svg/kaifa_icon_3.svg" alt="svg" />
              </div>
              <div class="six-section__list">
                <div>@mpxjs/cli</div>
                <div>脚手架工具</div>
              </div>
            </a>
          </li>
        </ul>
        <ul class="row six-section__row">
          <li>
            <a href="" class="six-section__item six-section__step">
              <div class="six-section__icon">
                <img src="../../public/doc-svg/kaifa_icon_4.svg" alt="svg" />
              </div>
              <div class="six-section__list">
                <div>@mpxjs/fetch</div>
                <div>网络请求库</div>
              </div>
            </a>
          </li>
          <li>
            <a href="" class="six-section__item six-section__step">
              <div class="six-section__icon">
                <img src="../../public/doc-svg/kaifa_icon_5.svg" alt="svg" />
              </div>
              <div class="six-section__list">
                <div>@mpxjs/api-proxy api</div>
                <div>增强调用</div>
              </div>
            </a>
          </li>
          <li>
            <a href="" class="six-section__item">
              <div class="six-section__icon">
                <img src="../../public/doc-svg/kaifa_icon_6.svg" alt="svg" />
              </div>
              <div class="six-section__list">
                <div>@mpxjs/webview-bridge web</div>
                <div>页面桥接</div>
              </div>
            </a>
          </li>
        </ul>
        <ul class="row">
          <li>
            <a href="" class="six-section__item six-section__step">
              <div class="six-section__icon">
                <img src="../../public/doc-svg/kaifa_icon_7.svg" alt="svg" />
              </div>
              <div class="six-section__list">
                <div>@mpxjs/vscode-plugin ide</div>
                <div>插件</div>
              </div>
            </a>
          </li>
          <li>
            <a href="" class="six-section__item six-section__step">
              <div class="six-section__icon">
                <img src="../../public/doc-svg/kaifa_icon_8.svg" alt="svg" />
              </div>
              <div class="six-section__list">
                <div>@mpxjs/es-check</div>
                <div>高级语法检查</div>
              </div>
            </a>
          </li>
          <li>
            <a href="" class="six-section__item">
              <div class="six-section__icon">
                <img src="../../public/doc-svg/kaifa_icon_9.svg" alt="svg" />
              </div>
              <div class="six-section__list">
                <div>@mpxjs/size-analyzer</div>
                <div>包体积分析工具</div>
              </div>
            </a>
          </li>
        </ul>
      </div>
    </section>

    <!-- 第七部分 -->
    <section class="seven-section">
      <p class="title">成功案例</p>
      <div class="row seven-section__wrap">
        <div class="grow">
          <p class="seven-section__title">滴滴出行</p>
          <p class="seven-section__desc">
            写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧写一些介绍的话语吧
          </p>
        </div>
        <div class="grow seven-section__center">
          <div class="seven-section__phone"></div>
        </div>
        <div class="grow"></div>
      </div>
      <ul>
        <li>
          <img
            src="https://dpubstatic.udache.com/static/dpubimg/bcca3d10-01b7-4c08-951a-22418b2443d6.jpg"
            alt="code"
          />
        </li>
        <li>
          <img
            src="https://dpubstatic.udache.com/static/dpubimg/708d5579-81f0-480e-96b3-5f49e8022273.jpg"
            alt="code"
          />
        </li>
        <li>
          <img
            src="https://dpubstatic.udache.com/static/dpubimg/8c25bec8-938e-452d-96f9-5e524092a8ee.png"
            alt="code"
          />
        </li>
        <li>
          <img
            src="https://dpubstatic.udache.com/static/dpubimg/8fdd04ed-a74b-4b87-be6e-652550fb843f.png"
            alt="code"
          />
        </li>
        <li>
          <img
            src="https://dpubstatic.udache.com/static/dpubimg/8fdd04ed-a74b-4b87-be6e-652550fb843f.png"
            alt="code"
          />
        </li>
        <li>
          <img
            src="https://dpubstatic.udache.com/static/dpubimg/d3b62a33-7dbd-45ea-a4aa-f30ad61965f2.jpg"
            alt="code"
          />
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
export default {}
</script>

<style lang="stylus" scoped>
ul li
  list-style none
.row
  display flex
  align-items center

.header
  padding 40px 0 0 30px
  position relative

.title
  font-size 30px
  margin-bottom 20px
  font-weight 500

.desc
  font-size 12px
  line-height 22px
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
  padding 0 200px

.one-section
  padding-top 181px
  width 100%

.one-section__title
  margin-bottom 20px
  font-size 40px
  font-weight 500
  border-bottom none

.one-section__desc
  width 450px
  line-height 30px
  margin-bottom 70px

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

.two-section
  padding-top 240px
  display flex
  justify-content center

.two-section__item 
  width 280px
  height 344px
  padding 40px 18px 46px 18px
  box-sizing border-box
  background #ffffff
  border 0 solid #efefef
  box-shadow 0 51px 145px 0 rgba(49, 188, 127, 0.1),
    0 11px 32px 0 rgba(49, 188, 127, 0.06),
    0 3px 10px 0 rgba(49, 188, 127, 0.04)
  border-radius 4px
  margin 0 10px
  text-align center
  list-style none
 

.two-section__step 
  position relative
  top 54px

.two-section__title 
  font-size 20px
  margin 33px 0 21px 0

.two-section__desc 
  font-size 12px
  line-height 22px
 

.three-section 
  margin-top 183px
  display flex
  background url("https://dpubstatic.udache.com/static/dpubimg/k_-K6Ok3Ap/todomvc_bg.png") no-repeat
  background-size 100% 713px
  padding 0 200px
  height 713px
  align-items center

.three-section__mvc 
  margin-left 60px

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

.grow 
  flex 1

.four-section__bg 
  background url("https://dpubstatic.udache.com/static/dpubimg/2EOn4VU6x-/jizhi_bg.png") no-repeat    
  background-size 100% 520px
  height 100%
  text-align center

.four-section__text 
  padding 0 200px 0 85px

.five-section__bg 
  background url("https://dpubstatic.udache.com/static/dpubimg/9Cs6CV_OF2/jianjin_bg.png") no-repeat
  background-size 100% 520px
  height 100%
  text-align center
 
.five-section__text 
  padding 0 85px 0 200px
 
.six-section 
  margin-top 140px
  display flex
  align-items center
  justify-content center
  background url("https://dpubstatic.udache.com/static/dpubimg/W5_rX8s40G/kaifa_bg.png") no-repeat
  background-size 100% 694px
  height 694px
 
.six-section__item 
  background #ffffff
  border 0 solid #a4a4a4
  border-radius 4px
  width 280px
  height 80px
  display flex
  padding 17px 0 17px 17px
  box-sizing border-box

.six-section__step 
  margin-right 20px

.six-section__row 
  margin-bottom 20px

.six-section__list 
  display flex
  flex-direction column
  justify-content space-between
  font-size 12px
  color #3A495D

.six-section__title 
  margin-bottom 50px
  text-align center
  color #ffffff

.six-section__icon 
  margin-right 9px

.seven-section 
  margin-top 113px
  padding 0 200px
  text-align center
 
.seven-section__center 
  width 402px
  background url("https://dpubstatic.udache.com/static/dpubimg/XrJHfoN2ky/anli_bg.png") no-repeat center center
  height 100%
  background-size contain

.seven-section__phone
  background url("https://dpubstatic.udache.com/static/dpubimg/hxFU4KVamb/anli_pic_phone.png") no-repeat center center
  height 100%
  background-size contain

.seven-section__wrap
  height 433px
  margin-top 40px

.seven-section__title 
  text-align left
  font-size 20px
  font-weight 600

.seven-section__desc
  margin-top 41px
  text-align left
  font-size 12px
  line-height 23px
</style>