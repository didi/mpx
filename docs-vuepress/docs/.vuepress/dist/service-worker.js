/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "404.html",
    "revision": "a5bd85939cf2c886d640c0efb4594173"
  },
  {
    "url": "api/builtIn.html",
    "revision": "56d866a3a0884a4d4dea673c20472759"
  },
  {
    "url": "api/compile.html",
    "revision": "4136377446d4fb850b1fe0eb42848ec6"
  },
  {
    "url": "api/config.html",
    "revision": "b4b074f308e19926b509baf3cdbb4887"
  },
  {
    "url": "api/directives.html",
    "revision": "28192283d61ef8b91bc6ea48fc065117"
  },
  {
    "url": "api/extend.html",
    "revision": "8f8d08d49ebff0a51c5a536e80aec5cb"
  },
  {
    "url": "api/global-api.html",
    "revision": "e3d510348acbd2583adfd8f6fb37106f"
  },
  {
    "url": "api/instance-api.html",
    "revision": "27b5a7fc1357285b4ebae6f130ab0388"
  },
  {
    "url": "articles/1.0.html",
    "revision": "912f09a99bfc77942af5c26110067908"
  },
  {
    "url": "articles/2.0.html",
    "revision": "df1eff400576ed3c4bfa81761531cecd"
  },
  {
    "url": "articles/2.7-release.html",
    "revision": "31054b54a278028453c0461487e307b1"
  },
  {
    "url": "articles/index.html",
    "revision": "422e2a282f31fd7560e48d4de29f1b02"
  },
  {
    "url": "articles/mpx1.html",
    "revision": "a27c454c10ebfe5e2cc48b1d4cd11957"
  },
  {
    "url": "articles/mpx2.html",
    "revision": "0e90649d19434db12b82821acba5dea1"
  },
  {
    "url": "articles/performance.html",
    "revision": "c2748d44cfa4f1d13fc5a8078c7ea1f6"
  },
  {
    "url": "articles/size-control.html",
    "revision": "2bead5f48e7b563c77c9572b235988c2"
  },
  {
    "url": "articles/ts-derivation.html",
    "revision": "03aa0bd651113e58cf5d7d839c9a74b6"
  },
  {
    "url": "assets/css/0.styles.9913be21.css",
    "revision": "9706e5bfdb268100b3ba564d089b099d"
  },
  {
    "url": "assets/img/cloud.793f8366.png",
    "revision": "793f8366debb6e4dbdb4083d49387336"
  },
  {
    "url": "assets/img/search.83621669.svg",
    "revision": "83621669651b9a3d4bf64d1a670ad856"
  },
  {
    "url": "assets/img/select-ts-version.e3131c18.png",
    "revision": "e3131c18af871494a62eda224b630632"
  },
  {
    "url": "assets/img/start-tips1.3b76ac97.png",
    "revision": "3b76ac977e543ae853c79f5fb4bf648d"
  },
  {
    "url": "assets/img/start-tips2.7d8836f8.png",
    "revision": "7d8836f8026aa7e1813ec450276d21ad"
  },
  {
    "url": "assets/js/1.8362f1c2.js",
    "revision": "a991b47ed47f4e3c9bea6c010eafca11"
  },
  {
    "url": "assets/js/10.fd0f5395.js",
    "revision": "8e9c4d86e0938e64e79b026845431821"
  },
  {
    "url": "assets/js/11.0d2e4af7.js",
    "revision": "d71a28273879d8f0782a86dfc9534001"
  },
  {
    "url": "assets/js/12.2c6c36bb.js",
    "revision": "4800ffbb8d4f9ab1ed0a564f04ce2a77"
  },
  {
    "url": "assets/js/13.edbfa566.js",
    "revision": "d3d2688032addd6ed17d3c58ff08ee29"
  },
  {
    "url": "assets/js/14.83ba8d76.js",
    "revision": "c06a04cc210b1744c5f74e7eaae652ac"
  },
  {
    "url": "assets/js/15.6cf1dc24.js",
    "revision": "5f51dc9a5e6de16f97012cfeaf30677a"
  },
  {
    "url": "assets/js/16.417155c7.js",
    "revision": "60ad6abaa0f644ac126e104aeec692cf"
  },
  {
    "url": "assets/js/17.cc6e5111.js",
    "revision": "e49e3f345b6e57e6069b7372029c7fb5"
  },
  {
    "url": "assets/js/18.b378d290.js",
    "revision": "3ba0c042e63a4654ff451b07da64c25b"
  },
  {
    "url": "assets/js/19.5c436eb1.js",
    "revision": "6fb5f2daefc9fa19f3996b749221dd7e"
  },
  {
    "url": "assets/js/2.e2289ad6.js",
    "revision": "9c717bed9c32bdf2007ec82be1a671ef"
  },
  {
    "url": "assets/js/20.38a71dd8.js",
    "revision": "40efe4debabe4907df41d643053c0960"
  },
  {
    "url": "assets/js/21.7b33ed8c.js",
    "revision": "80687eef9d666bfb1a31c8b8ec5f1fe8"
  },
  {
    "url": "assets/js/22.d6b28d2e.js",
    "revision": "37c6eac7c7f7e99c644f3cb1170502bd"
  },
  {
    "url": "assets/js/23.1bb3d80b.js",
    "revision": "6ff698e61255761f8b00766471ed3a97"
  },
  {
    "url": "assets/js/24.1c6500e1.js",
    "revision": "78b8090d618ffb7943e203fb46c18a01"
  },
  {
    "url": "assets/js/25.65058d3a.js",
    "revision": "06df5a2543aeafea18c800cee3c58d15"
  },
  {
    "url": "assets/js/26.dd48289b.js",
    "revision": "bc9ca469ea9d4178949222fdbcd16969"
  },
  {
    "url": "assets/js/27.cd0763e3.js",
    "revision": "b73c52b93bc2cbfb5d68836c8d2bf07a"
  },
  {
    "url": "assets/js/28.677927d7.js",
    "revision": "7918114a1c6eca133a5ef99c89bb6c4b"
  },
  {
    "url": "assets/js/29.08cc9ede.js",
    "revision": "07402bbfe48e3a58e77a4fc62c120742"
  },
  {
    "url": "assets/js/30.61d2042c.js",
    "revision": "00d3a2ada15ae6196a936ff43a6c5651"
  },
  {
    "url": "assets/js/31.361d3fef.js",
    "revision": "50f747c7e5621b54e6900b8eba7ae088"
  },
  {
    "url": "assets/js/32.30663c92.js",
    "revision": "4872e03fa3970e05522e0dc38eab403e"
  },
  {
    "url": "assets/js/33.f30fdf06.js",
    "revision": "059e80f42f5fcae09c668f4208703f97"
  },
  {
    "url": "assets/js/34.45c1d2d3.js",
    "revision": "1dcfcdfa6b29902340984f4419df5515"
  },
  {
    "url": "assets/js/35.607390b6.js",
    "revision": "ca5fb1e639149d90e7f76cb7b4ef3fce"
  },
  {
    "url": "assets/js/36.60cd9a9e.js",
    "revision": "dc7a799f6a09a510f4079c0d6ea53371"
  },
  {
    "url": "assets/js/37.4f688e60.js",
    "revision": "0acf3261f79631f96779b44da9ff4dc3"
  },
  {
    "url": "assets/js/38.b47a446a.js",
    "revision": "80381e601122fa0ac996e5bc4d2b994f"
  },
  {
    "url": "assets/js/39.499aa852.js",
    "revision": "7465c5753434379ca450c262e3d77871"
  },
  {
    "url": "assets/js/4.1f2e8e96.js",
    "revision": "ce53cdf3b685ceec3167cf0e0f1b39e0"
  },
  {
    "url": "assets/js/40.bfacec42.js",
    "revision": "8e147e3b50f4ade45964c6e5befe8f5c"
  },
  {
    "url": "assets/js/41.140b5336.js",
    "revision": "45c5770b618945be02cc63a4ebefc5c4"
  },
  {
    "url": "assets/js/42.5bd54330.js",
    "revision": "f15dc1cdd9f5d8d0ea358148ed5bbea1"
  },
  {
    "url": "assets/js/43.9d595a42.js",
    "revision": "97a3e8efff9d3af94d8e5ed5761eaee1"
  },
  {
    "url": "assets/js/44.72af5911.js",
    "revision": "7db838a49422fce0501e3d03bfd08fcf"
  },
  {
    "url": "assets/js/45.2f2a87c3.js",
    "revision": "608b8e6ea11feffd6d01401e19476f12"
  },
  {
    "url": "assets/js/46.2e5fdde3.js",
    "revision": "c742d47a8d8b18a4c704c2acdf29595b"
  },
  {
    "url": "assets/js/47.f95e0062.js",
    "revision": "ffcbbb673f46fabef722c4df6ca6f1d3"
  },
  {
    "url": "assets/js/48.e5029069.js",
    "revision": "a7dd6bfafcf0811998a41fdc2fa7952d"
  },
  {
    "url": "assets/js/49.5de82fff.js",
    "revision": "3bf90529efc64d69a9d2c7ae6808df4f"
  },
  {
    "url": "assets/js/5.b5910773.js",
    "revision": "c55baa71648059e757f6ad0cae7531f2"
  },
  {
    "url": "assets/js/50.0e800e46.js",
    "revision": "dd6b7f54cd3f6719ad80aa1c6f04c751"
  },
  {
    "url": "assets/js/51.9c9d4fae.js",
    "revision": "e73e18eb9c50e6d315508e43aac092e8"
  },
  {
    "url": "assets/js/52.03c99e23.js",
    "revision": "d7f0a13e03346fdceb28c8247da2615a"
  },
  {
    "url": "assets/js/53.f8ba4f1d.js",
    "revision": "2bc517955257e86f17e38289257b9086"
  },
  {
    "url": "assets/js/54.be8be90f.js",
    "revision": "41b2887755e3ebc28390b33a046bbfb2"
  },
  {
    "url": "assets/js/55.a697da32.js",
    "revision": "0fb2174156323e774b6d942a2b4cd141"
  },
  {
    "url": "assets/js/56.ec7de33d.js",
    "revision": "9904e1decf171e003be5667abe31aa97"
  },
  {
    "url": "assets/js/57.5ab60986.js",
    "revision": "f4d178459e33bb8cfbfb62bdbef91bd8"
  },
  {
    "url": "assets/js/58.6d73f23b.js",
    "revision": "2f28de611cdf0d08e07219f50c17a571"
  },
  {
    "url": "assets/js/59.c960b24a.js",
    "revision": "2bde78921ed0d876245d6c3b6ed8e8dc"
  },
  {
    "url": "assets/js/6.831707e4.js",
    "revision": "25c31a5ba9bf37935de242f8e3619ab0"
  },
  {
    "url": "assets/js/60.aa0ee4b1.js",
    "revision": "fd64451cea18ed0f704d59113a801644"
  },
  {
    "url": "assets/js/61.3fbe8717.js",
    "revision": "856b1f2c247aa5cc429b007fba438c32"
  },
  {
    "url": "assets/js/62.fe55872e.js",
    "revision": "704030cf692a9861d8f7c4308d466d57"
  },
  {
    "url": "assets/js/63.94c76cd3.js",
    "revision": "20cad4ffffd0cb34003d9056f5d3f07c"
  },
  {
    "url": "assets/js/64.fbf9bb6c.js",
    "revision": "3d6d8501628c493f87733e88b87dd3e8"
  },
  {
    "url": "assets/js/65.e7240ed7.js",
    "revision": "2c4d981c239937948e1183f5ed6bd9f2"
  },
  {
    "url": "assets/js/66.539127de.js",
    "revision": "0777a2a5c0dbbdc03113df2bee493c50"
  },
  {
    "url": "assets/js/67.060c4e85.js",
    "revision": "19d591bf8e10b02414a2c5aa2839a760"
  },
  {
    "url": "assets/js/68.e4ee3984.js",
    "revision": "4bf1db34059e2da55bc1578052c98122"
  },
  {
    "url": "assets/js/69.06a4432a.js",
    "revision": "a70972693f355d0fb90adf2920dec0db"
  },
  {
    "url": "assets/js/7.d18ec5bf.js",
    "revision": "6f8fac77507d7c010e0a11f40666f61a"
  },
  {
    "url": "assets/js/8.465b2516.js",
    "revision": "dabbc3f7756993d189ad025a3dc53ada"
  },
  {
    "url": "assets/js/9.83220d36.js",
    "revision": "48b0c541cce723519d6d582b4a2b72ea"
  },
  {
    "url": "assets/js/app.b3e4347f.js",
    "revision": "88020b6705b401e627148e3500ae5c4c"
  },
  {
    "url": "desc.html",
    "revision": "10c1b9824feb8ffc57b63d47f9c538ff"
  },
  {
    "url": "guide/advance/ability-compatible.html",
    "revision": "070aca272cdb9ba8773a0ff8017d4e5f"
  },
  {
    "url": "guide/advance/async-subpackage.html",
    "revision": "3fb5e30263a387d1d83f4520cc9bf886"
  },
  {
    "url": "guide/advance/custom-output-path.html",
    "revision": "744bcc07b5898a29fd69d4f31c695b20"
  },
  {
    "url": "guide/advance/dll-plugin.html",
    "revision": "d4aa8ffa92cccc4b31d06ecce7e7a361"
  },
  {
    "url": "guide/advance/image-process.html",
    "revision": "7ab64d47e23cba41c0407f89353eb364"
  },
  {
    "url": "guide/advance/mixin.html",
    "revision": "d13005c1b0af4ddffa328912e59af1f8"
  },
  {
    "url": "guide/advance/npm.html",
    "revision": "03866d887736af41eb9cbcae02afc9b1"
  },
  {
    "url": "guide/advance/platform.html",
    "revision": "d38639203d1b468cadac4183409bd9ac"
  },
  {
    "url": "guide/advance/plugin.html",
    "revision": "ace911e528c4fa412c3789f2cf0e683e"
  },
  {
    "url": "guide/advance/progressive.html",
    "revision": "ba184f27040023f739efb1b5100aa55a"
  },
  {
    "url": "guide/advance/size-report.html",
    "revision": "5e0a30a8cf0ab26bf2506b873eaf5bd9"
  },
  {
    "url": "guide/advance/store.html",
    "revision": "3ba146b936f2ebd176787efb7bd59ae4"
  },
  {
    "url": "guide/advance/subpackage.html",
    "revision": "37f7266308d5478fa3f9993c55fad0f7"
  },
  {
    "url": "guide/basic/class-style-binding.html",
    "revision": "bc082701f4cfcf3f16762c415372dd36"
  },
  {
    "url": "guide/basic/component.html",
    "revision": "ea89b0aa012709be2c211242914b5134"
  },
  {
    "url": "guide/basic/conditional-render.html",
    "revision": "ce94fc63385f8615cf038747ca3165d4"
  },
  {
    "url": "guide/basic/css.html",
    "revision": "72736d00f31c4a61172d12b125e52b3b"
  },
  {
    "url": "guide/basic/event.html",
    "revision": "a082ddbcb169b39fb91bc5a65c340f7b"
  },
  {
    "url": "guide/basic/ide.html",
    "revision": "8de7903333076c30653cffb389f3afc6"
  },
  {
    "url": "guide/basic/intro.html",
    "revision": "a80711d9decd3df5b8da476c9beb3a1f"
  },
  {
    "url": "guide/basic/list-render.html",
    "revision": "b733c9150c3115f0cf8854ea197ac3e1"
  },
  {
    "url": "guide/basic/reactive.html",
    "revision": "99a455e0ae725e7f7793f3ec38438492"
  },
  {
    "url": "guide/basic/refs.html",
    "revision": "dfdeb60fd5976c00d6c6e3304def0418"
  },
  {
    "url": "guide/basic/single-file.html",
    "revision": "5e425ef9201487ccd2c468c5f3618c79"
  },
  {
    "url": "guide/basic/start.html",
    "revision": "1c03b5d069b8e7afb1c72c171eb670d5"
  },
  {
    "url": "guide/basic/template.html",
    "revision": "d81026ea1ca443431542efa7619388f9"
  },
  {
    "url": "guide/basic/two-way-binding.html",
    "revision": "b811988d99006442159bb0ada48836ad"
  },
  {
    "url": "guide/extend/api-proxy.html",
    "revision": "3c769a21d2e7e0180ba32d0c9d8eb2c5"
  },
  {
    "url": "guide/extend/index.html",
    "revision": "03f6fc7c7800bd4723f63671ecd79a59"
  },
  {
    "url": "guide/extend/mock.html",
    "revision": "b6924b3ca56c83a5b99f3204b517c56f"
  },
  {
    "url": "guide/extend/request.html",
    "revision": "e702376fed3a4584dedbe6801f620167"
  },
  {
    "url": "guide/migrate/2.7.html",
    "revision": "61355058e80735457f50bc2e38078eeb"
  },
  {
    "url": "guide/tool/e2e-test.html",
    "revision": "460d29ec515da0d48d1e3055a70053ca"
  },
  {
    "url": "guide/tool/i18n.html",
    "revision": "53f721c44e6fb29adf712360f0c55e7c"
  },
  {
    "url": "guide/tool/ts.html",
    "revision": "edcb871aebd089a496ca9843dc05c008"
  },
  {
    "url": "guide/tool/unit-test.html",
    "revision": "115a7ad5a9781e062d05b7a8fe14ce73"
  },
  {
    "url": "guide/understand/compile.html",
    "revision": "67798e7bc8009cd7f3ffa266d48dff46"
  },
  {
    "url": "guide/understand/runtime.html",
    "revision": "d335c78b3428e93931a34279a0403f83"
  },
  {
    "url": "index.html",
    "revision": "930eee28e2278704a2f0ffa781791684"
  },
  {
    "url": "logo.png",
    "revision": "b362e51deb26ea4ff1d0daa6da1e7c44"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
addEventListener('message', event => {
  const replyPort = event.ports[0]
  const message = event.data
  if (replyPort && message && message.type === 'skip-waiting') {
    event.waitUntil(
      self.skipWaiting().then(
        () => replyPort.postMessage({ error: null }),
        error => replyPort.postMessage({ error })
      )
    )
  }
})
