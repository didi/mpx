<template>
  <div>
    <footer class="footer">
      <ul class="footer__list">
        <li class="grow">
          <ul>
            <li class="footer__wrap">
              <span class="footer__text footer__title">{{$page.frontmatter.resourcesList.title}}</span>
            </li>
            <li class="footer__wrap" v-for="(item, index) in $page.frontmatter.resourcesList.details" :key="index">
              <a :href="item.actionLink" class="footer__text" target="_blank">{{item.title}}</a>
            </li>
          </ul>
        </li>
        <li class="grow">
          <ul>
            <li class="footer__wrap">
              <span class="footer__text footer__title">{{$page.frontmatter.communityList.title}}</span>
            </li>
            <li class="footer__wrap" v-for="(item, index) in $page.frontmatter.communityList.details" :key="index">
              <popover :code="item.img" v-if="item.img">
                <span class="footer__text" target="_blank">{{item.title}}</span>
              </popover>
              <a v-else :href="item.img || item.actionLink" class="footer__text" target="_blank">{{item.title}}</a>
            </li>
          </ul>
        </li>
        <li class="grow">
          <ul>
            <li class="footer__wrap">
              <span class="footer__text footer__title">{{$page.frontmatter.helpList.title}}</span>
            </li>
            <li class="footer__wrap" v-for="(item, index) in $page.frontmatter.helpList.details" :key="index">
              <a :href="item.actionLink" class="footer__text" target="_blank">{{item.title}}</a>
            </li>
          </ul>
        </li>
        <li class="grow">
          <ul>
            <li class="footer__wrap">
              <span class="footer__text footer__title">{{$page.frontmatter.moreList.title}}</span>
            </li>
            <li class="footer__wrap" v-for="(item, index) in $page.frontmatter.moreList.details" :key="index">
              <a :href="item.actionLink" class="footer__text" target="_blank">{{item.title}}</a>
            </li>
          </ul>
        </li>
      </ul>
    </footer>
    <div class="copyright">Copyright 2020 滴滴出行</div>
  </div>
</template>

<script>
import Popover from '../components/Popover.vue'

export default {
  components: {
    Popover
  }
};
</script>

<style lang="stylus" scoped>
ul li
    list-style none

.footer
    //   margin-top 60px
    display flex
    text-align center
    //   padding 0 200px
    height 139px
    background #606D7C
    // position absolute
    // bottom 0
.footer__list
    margin-top 28px
    display flex
    flex 1
    text-align left

.footer__wrap
    margin-bottom 13px
    color #ffffff
    text-align left
    // height 28px
    position relative

.footer__text
    font-family: PingFangSC-Medium
    font-size: 12px
    color: #FFFFFF
    letter-spacing: 0
    font-weight: 500
    display inline-block
    text-align left
    // height 28px

.footer__title
    opacity: 0.5;
    // border: 1px solid #979797;
    font-family: PingFangSC-Medium;
    font-size: 12px;
    color: #FFFFFF;
    letter-spacing: 0;
    font-weight: 500;

.copyright
    height 39px
    font-size 12px
    color #FFFFFF
    background #3a495d
    text-align center
    line-height 39px

.grow
    flex 1
</style>