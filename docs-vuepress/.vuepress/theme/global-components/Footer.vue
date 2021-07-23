<template>
  <div>
    <footer class="footer">
      <ul class="footer__list">
        <li class="grow">
          <img
            width="180"
            src="https://dpubstatic.udache.com/static/dpubimg/cCGcEcig69/footer_logo.png"
            alt="logo"
          />
        </li>
        <li class="grow">
          <ul>
            <li class="footer__wrap">
              <span class="footer__text footer__title">资源</span>
            </li>
            <li class="footer__wrap">
              <a href="" class="footer__text">更多</a>
            </li>
          </ul>
        </li>
        <li class="grow">
          <ul>
            <li class="footer__wrap">
              <span class="footer__text footer__title">社区</span>
            </li>
            <li class="footer__wrap">
              <a href="" class="footer__text">更多</a>
            </li>
          </ul>
        </li>
        <li class="grow">
          <ul>
            <li class="footer__wrap">
              <span class="footer__text footer__title">帮助</span>
            </li>
            <li class="footer__wrap">
              <a href="" class="footer__text">更多</a>
            </li>
          </ul>
        </li>
        <li class="grow">
          <ul>
            <li class="footer__wrap">
              <span class="footer__text footer__title">更多</span>
            </li>
            <li class="footer__wrap">
              <a href="" class="footer__text">更多</a>
            </li>
          </ul>
        </li>
      </ul>
    </footer>
    <div class="copyright">Copyright 2020 滴滴出行</div>
  </div>
</template>

<script>
export default {};
</script>

<style>
.footer {
  margin-top: 120px;
  display: flex;
  align-items: center;
  text-align: center;
  padding: 0 200px;
  height: 436px;
  background: url("https://dpubstatic.udache.com/static/dpubimg/NbnyMuw0A1/footer_bg.png")
    no-repeat;
  background-size: 100% 436px;
}

.footer__list {
  display: flex;
  flex: 1;
  text-align: left;
}

.footer__wrap {
  margin: 14px 0;
  color: #ffffff;
  text-align: center;
}

.footer__text {
  font-size: 14px;
  margin: 14px 0;
  color: #ffffff;
  display: inline-block;
  text-align: left;
  width: 40px;
}

.footer__title {
  font-size: 20px;
}

.copyright {
  height: 50px;
  font-size: 12px;
  color: #ffffff;
  background: #3a495d;
  text-align: center;
  line-height: 50px;
}
</style>