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
    "revision": "5b00337f21832bd4573ba6c98bedacb4"
  },
  {
    "url": "api/ApiIndex.html",
    "revision": "f5736e201b8355b58c4a3127475e6757"
  },
  {
    "url": "api/app-config.html",
    "revision": "73b3f4c261fc6ad75418f21d0f696b62"
  },
  {
    "url": "api/builtIn.html",
    "revision": "e854e0ad752129084b0de9d2a9b692fd"
  },
  {
    "url": "api/compile.html",
    "revision": "5eb3d7fe5d6193c15061bcca578def13"
  },
  {
    "url": "api/composition-api.html",
    "revision": "70dccb11a976b0321ae6c6df8cbccf83"
  },
  {
    "url": "api/directives.html",
    "revision": "39ac7af3ed7a9131d4dad8bbda934d5e"
  },
  {
    "url": "api/extend.html",
    "revision": "67026f94a9c9fb2b42094426f6157048"
  },
  {
    "url": "api/global-api.html",
    "revision": "33d7c25d85ca74401645e05f2e5990f1"
  },
  {
    "url": "api/index.html",
    "revision": "a0bb36716602184632c2781156f0256e"
  },
  {
    "url": "api/instance-api.html",
    "revision": "2999969ec01f4b0893d81a7c810e05f7"
  },
  {
    "url": "api/optional-api.html",
    "revision": "52cf38d179e9e86b426fe9c31b758659"
  },
  {
    "url": "api/reactivity-api.html",
    "revision": "a580e6086de61b32a4442ff42d8e6caa"
  },
  {
    "url": "api/store-api.html",
    "revision": "fc79ec11f5b437574ee9c0d3f0b51a36"
  },
  {
    "url": "articles/1.0.html",
    "revision": "c7408bac5c637d07a68bd9f1e0579d47"
  },
  {
    "url": "articles/2.0.html",
    "revision": "89411f8727853b0ad8db88d46d2f92d0"
  },
  {
    "url": "articles/2.7-release.html",
    "revision": "36f589577d67385b01da5b910e5e4f43"
  },
  {
    "url": "articles/2.8-release-alter.html",
    "revision": "c7c41c65d2fcc7577004ce04712d5e46"
  },
  {
    "url": "articles/2.8-release.html",
    "revision": "c968dd0160e52f569d8a35f6978c22cb"
  },
  {
    "url": "articles/2.9-release-alter.html",
    "revision": "842d2cf8a91c896bf46ff406a900951e"
  },
  {
    "url": "articles/2.9-release.html",
    "revision": "7714799727658659001df91df0ab765d"
  },
  {
    "url": "articles/index.html",
    "revision": "28e08a2249444d784e1b13e59cb8e0ba"
  },
  {
    "url": "articles/mpx-cli-next.html",
    "revision": "9edaa671d20c5721ade80295c5487d9a"
  },
  {
    "url": "articles/mpx-cube-ui.html",
    "revision": "339facb42ee86b3f21cbf22195f0ea7c"
  },
  {
    "url": "articles/mpx1.html",
    "revision": "b09e8d522bf61190a9b2cf2c77b1c9e9"
  },
  {
    "url": "articles/mpx2.html",
    "revision": "628254e250ec236cfc816e2f6dcd3098"
  },
  {
    "url": "articles/performance.html",
    "revision": "62339e70fe8371692b301f390ece7791"
  },
  {
    "url": "articles/size-control.html",
    "revision": "8256646d0a2da95674f4f7deab424781"
  },
  {
    "url": "articles/ts-derivation.html",
    "revision": "15a7473ded3bb895564dce5ebb866f76"
  },
  {
    "url": "articles/unit-test.html",
    "revision": "2b5854814775bb3f12b5f87cd3807433"
  },
  {
    "url": "assets/css/0.styles.f22478ca.css",
    "revision": "20c20b6924c0d21c3946c0c2f73e3852"
  },
  {
    "url": "assets/img/search.83621669.svg",
    "revision": "83621669651b9a3d4bf64d1a670ad856"
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
    "url": "assets/js/1.4f7abe8f.js",
    "revision": "12b0c0887ef86bb29d29e515a8254df4"
  },
  {
    "url": "assets/js/10.0192acce.js",
    "revision": "2e489bb3c3e4db7eb021df8227a78d17"
  },
  {
    "url": "assets/js/100.f31ffd06.js",
    "revision": "5204b3c7795a10953cdf3e4715daaeec"
  },
  {
    "url": "assets/js/101.283d0363.js",
    "revision": "a02fdbbcd800637e2e923ae5ce3f526f"
  },
  {
    "url": "assets/js/102.094a0a16.js",
    "revision": "c6084875d5966ca473c712a0c8eb8592"
  },
  {
    "url": "assets/js/103.b34f6752.js",
    "revision": "385380e54f276b92c30b8c769eb3500f"
  },
  {
    "url": "assets/js/104.78f6358e.js",
    "revision": "eeeb9573bb2e751a7efcf7b866d559a4"
  },
  {
    "url": "assets/js/105.eb6680fc.js",
    "revision": "fbbf2d50f5f790400258587ca7d319ab"
  },
  {
    "url": "assets/js/106.471f03cf.js",
    "revision": "3a2b07fdde55595e53ee58f20d93fb35"
  },
  {
    "url": "assets/js/107.63fd18fd.js",
    "revision": "8e1580b610cbe287488f9dc6a17c21a0"
  },
  {
    "url": "assets/js/108.614260e9.js",
    "revision": "960d17597536a94c9f465c1f183470ad"
  },
  {
    "url": "assets/js/109.3da50cc1.js",
    "revision": "85bb938489ee7bdb469106adf4520d52"
  },
  {
    "url": "assets/js/11.d7a8d045.js",
    "revision": "9bc45c1f6e30baa42b6f61119767b063"
  },
  {
    "url": "assets/js/110.f74ff3a3.js",
    "revision": "8b75f04fbf04424cc6c55c9f2dbec4a7"
  },
  {
    "url": "assets/js/111.51932e54.js",
    "revision": "08920579c78da19f6afbc656719be751"
  },
  {
    "url": "assets/js/112.da7bd3e7.js",
    "revision": "fe8d576cf790411d588601fae4414b03"
  },
  {
    "url": "assets/js/113.caaf11a3.js",
    "revision": "414f18602138c0fb69fb8e493d5659dd"
  },
  {
    "url": "assets/js/114.16cda7ac.js",
    "revision": "a50fb0cd876585fa9a81503bfee109f9"
  },
  {
    "url": "assets/js/115.88124b12.js",
    "revision": "3440d45dc5afd506ea94fd2159c1b733"
  },
  {
    "url": "assets/js/116.4a116234.js",
    "revision": "77eb5727ecdf8abd544ab6180852ab0a"
  },
  {
    "url": "assets/js/117.e45c1b95.js",
    "revision": "22697b9821bf9d90ef8542c9f525bc4f"
  },
  {
    "url": "assets/js/118.9cbac09e.js",
    "revision": "2ee13a56a4d9163596caa0d4c599d268"
  },
  {
    "url": "assets/js/119.312e4c21.js",
    "revision": "00e5ef4ca7025684be01fd3aefee9bdc"
  },
  {
    "url": "assets/js/12.4d7217be.js",
    "revision": "cf2ee26c47e0f0d7ee3f2bda3d92cf40"
  },
  {
    "url": "assets/js/120.7a6b4035.js",
    "revision": "7967e6835f248a74746ab0aa147c5177"
  },
  {
    "url": "assets/js/14.7377c68f.js",
    "revision": "b7514f8cb2d06cdaf18d71594d346192"
  },
  {
    "url": "assets/js/15.6f885a83.js",
    "revision": "40c60e1604dfac53cae641e598daf156"
  },
  {
    "url": "assets/js/16.974f551e.js",
    "revision": "df88e248621a7536527b6a547143dc57"
  },
  {
    "url": "assets/js/17.e94e6745.js",
    "revision": "afe65725c62091da4210e3c489f993f6"
  },
  {
    "url": "assets/js/18.b1f7a4a2.js",
    "revision": "2746cf3eaba809a8792ab8e911b6e6b1"
  },
  {
    "url": "assets/js/19.62186e92.js",
    "revision": "2e5228047eaba20f8fcc067431adb2a4"
  },
  {
    "url": "assets/js/2.314c65b9.js",
    "revision": "b8cf0e72859eb5f0e3fb7f67d27ef340"
  },
  {
    "url": "assets/js/20.e9cd4de3.js",
    "revision": "0045f2d19fe78531ce98e2db9aa6bdd5"
  },
  {
    "url": "assets/js/21.217f8fa9.js",
    "revision": "bd130990daa769d2fb63d19c19c31932"
  },
  {
    "url": "assets/js/22.4cd3344f.js",
    "revision": "db69d7654880d9f1c64373d171c787b6"
  },
  {
    "url": "assets/js/23.365f9a87.js",
    "revision": "cd54b4361286190f19e5c3067303c425"
  },
  {
    "url": "assets/js/24.17777a13.js",
    "revision": "eb0f29a4f257f591178f6201882b8298"
  },
  {
    "url": "assets/js/25.889c07d7.js",
    "revision": "5a964529d1992e5ecbe2f545980ee947"
  },
  {
    "url": "assets/js/26.3aa9f276.js",
    "revision": "03b8f1eb7e4dbebe65672c17914db693"
  },
  {
    "url": "assets/js/27.1a35170a.js",
    "revision": "7d5ed813bbe766a1748a0f21ee5569d8"
  },
  {
    "url": "assets/js/28.3670fa46.js",
    "revision": "6e3c125eaf27c095cad1d77637e4e80f"
  },
  {
    "url": "assets/js/29.a911e510.js",
    "revision": "363f3beef26a3abf2161c7e1278cfcae"
  },
  {
    "url": "assets/js/3.145e69cd.js",
    "revision": "1a153ade78a92885e52f897ec87c1c3e"
  },
  {
    "url": "assets/js/30.04d1a7ea.js",
    "revision": "578f318e24529539c775d12d5436fca8"
  },
  {
    "url": "assets/js/31.ec06bf2f.js",
    "revision": "00a3a86bdd7caad32fa0eec96cf4698a"
  },
  {
    "url": "assets/js/32.f29d2cd1.js",
    "revision": "7d811f0e993fbee6e7c7d6800f830839"
  },
  {
    "url": "assets/js/33.936d018e.js",
    "revision": "2714336439729f02460fbcd2af4a7c5c"
  },
  {
    "url": "assets/js/34.f494d685.js",
    "revision": "3f1099fca4eff5ef8e62348425a3e7ff"
  },
  {
    "url": "assets/js/35.c3ed1ff7.js",
    "revision": "8f836b9e9e2107c4c281203b190ef9a8"
  },
  {
    "url": "assets/js/36.d2c9afa9.js",
    "revision": "fe308138cfddd6e5819569d6609a7672"
  },
  {
    "url": "assets/js/37.4e1eee2c.js",
    "revision": "0efac40e5dd0e3fc8e94f0b8cda4f0b2"
  },
  {
    "url": "assets/js/38.7826170e.js",
    "revision": "8e5e62243cab1c2f356d0f77ffac4b04"
  },
  {
    "url": "assets/js/39.094ffa40.js",
    "revision": "4342737cae50042277b76721d79315d2"
  },
  {
    "url": "assets/js/4.9489102c.js",
    "revision": "c5f4723242bd00da0724a4737e1cb142"
  },
  {
    "url": "assets/js/40.10d90636.js",
    "revision": "76033b573e4da1b2cd491c8794b35af7"
  },
  {
    "url": "assets/js/41.8351af86.js",
    "revision": "16e3ded52f241dfcedb215d3e784ffd2"
  },
  {
    "url": "assets/js/42.53972f6c.js",
    "revision": "f59a9f585a6b06d80cebcdb81772acd0"
  },
  {
    "url": "assets/js/43.e2b432ea.js",
    "revision": "f0fb7f9acf7bfd42c8777fa0532a4f7c"
  },
  {
    "url": "assets/js/44.e4242a1f.js",
    "revision": "397c66f6b7866718983234d014f94e60"
  },
  {
    "url": "assets/js/45.392413aa.js",
    "revision": "51fcb57964dd90d24c02593411a478cd"
  },
  {
    "url": "assets/js/46.22f9a9c6.js",
    "revision": "d8f80568057ee4169e8f145ed42a28d8"
  },
  {
    "url": "assets/js/47.2bd2cecc.js",
    "revision": "09684550aea02b1058ea119724a2fed1"
  },
  {
    "url": "assets/js/48.55792a30.js",
    "revision": "6900523d21b183f5a8aae5e2799674cc"
  },
  {
    "url": "assets/js/49.cde94a79.js",
    "revision": "3c992f7d6d21537ae32091b611215346"
  },
  {
    "url": "assets/js/5.12d049b6.js",
    "revision": "d489c45818dd2315c2c97a3437acd6cf"
  },
  {
    "url": "assets/js/50.42e34e52.js",
    "revision": "1831c8d5de17eeed779edb5f28385671"
  },
  {
    "url": "assets/js/51.90dfa84e.js",
    "revision": "531ac61e50a863e5bb409b2f893c4240"
  },
  {
    "url": "assets/js/52.10bb0251.js",
    "revision": "79eb24907253da0d7120ae9dcf34c73f"
  },
  {
    "url": "assets/js/53.7207ffc5.js",
    "revision": "53164733a3c1e6f29a4ca6719591b70b"
  },
  {
    "url": "assets/js/54.af3d3dcd.js",
    "revision": "f175b1f13236f10b690d5e86b9bb368d"
  },
  {
    "url": "assets/js/55.2d6ae2e1.js",
    "revision": "eb8dd3e8ff4c57ed143c9778ec15bd4b"
  },
  {
    "url": "assets/js/56.9aec9a9e.js",
    "revision": "5ebf6c52558f0709c076b202a55b9fa3"
  },
  {
    "url": "assets/js/57.9d9ddcbd.js",
    "revision": "99117ec556700247d528c7acd29c203b"
  },
  {
    "url": "assets/js/58.50eb3b91.js",
    "revision": "e7f565c15f3cab12bf1eedf0659fd523"
  },
  {
    "url": "assets/js/59.27106fbb.js",
    "revision": "f485b2d1b0a56c26176ea8f44f9e2738"
  },
  {
    "url": "assets/js/6.6ea91b28.js",
    "revision": "5fac1ead0dd12855a5d8976740456131"
  },
  {
    "url": "assets/js/60.a47e5279.js",
    "revision": "f6f5d7dc973878332b5b1d0157f92135"
  },
  {
    "url": "assets/js/61.74ebd7d9.js",
    "revision": "ae27832c8fa41953cc04725e0d5001d0"
  },
  {
    "url": "assets/js/62.4bf212f9.js",
    "revision": "2ae416136507b54b6c19f00f94ea9dd4"
  },
  {
    "url": "assets/js/63.b54aca3e.js",
    "revision": "80860c2eb8c0374ffd19206c3653a451"
  },
  {
    "url": "assets/js/64.399e72b8.js",
    "revision": "d9f80db9175e32d06a3ea1077135f0e4"
  },
  {
    "url": "assets/js/65.a8c627d3.js",
    "revision": "779b4c30258b0bd6aad23a1436bc1b92"
  },
  {
    "url": "assets/js/66.7f19cc4b.js",
    "revision": "2e79a49876a6073bd459a1575199269d"
  },
  {
    "url": "assets/js/67.e57db97e.js",
    "revision": "78a67eab42f946943b9651d089a4ef56"
  },
  {
    "url": "assets/js/68.ebe4213c.js",
    "revision": "93e3246379979219b4af948dba1bc71a"
  },
  {
    "url": "assets/js/69.2d309866.js",
    "revision": "f5dc40ff8ea229a2fa6ac697fcf42475"
  },
  {
    "url": "assets/js/7.01e4e942.js",
    "revision": "e4797b632e362ecd096a64375e7003ae"
  },
  {
    "url": "assets/js/70.60ae83e6.js",
    "revision": "acba0df2ef73d360ec4686677942d0a4"
  },
  {
    "url": "assets/js/71.188d7bca.js",
    "revision": "cf49e628f26e54631f9a3fcb3f909fbc"
  },
  {
    "url": "assets/js/72.3f7bfd0d.js",
    "revision": "8b3a18399033b6fbc07696b31226998a"
  },
  {
    "url": "assets/js/73.171571e4.js",
    "revision": "4152daed0ad6a65b39b3f20c0ba648ca"
  },
  {
    "url": "assets/js/74.3d5cfaba.js",
    "revision": "0fbea56200387d87caa90abc9f1c807d"
  },
  {
    "url": "assets/js/75.093d716c.js",
    "revision": "0abd2acf22923e75799377e678b91077"
  },
  {
    "url": "assets/js/76.50d84c61.js",
    "revision": "c299d111edbf4d3c46c44c9374a3e4f3"
  },
  {
    "url": "assets/js/77.7bc0f013.js",
    "revision": "6d86d8510f2fb24917c56fcd00333e12"
  },
  {
    "url": "assets/js/78.e2ded2d4.js",
    "revision": "4058b878e45344934acd21b46e02795f"
  },
  {
    "url": "assets/js/79.f7eeb76b.js",
    "revision": "8e9491e599a437e2d5affbbfbd58559c"
  },
  {
    "url": "assets/js/8.ba7f6ace.js",
    "revision": "3db41c27492ef5d04cfe98f3ba38c493"
  },
  {
    "url": "assets/js/80.41418749.js",
    "revision": "76617f3118e34b77c5ce0cddcebd6ec4"
  },
  {
    "url": "assets/js/81.16e2cc83.js",
    "revision": "2ad3cec1add1ede3456c3c89a27f2a07"
  },
  {
    "url": "assets/js/82.56c0d7c1.js",
    "revision": "5ef8ed46677490c1264882fe0c1eade8"
  },
  {
    "url": "assets/js/83.ea65d6b1.js",
    "revision": "2629982f8da068c64b96af5cb7cc0170"
  },
  {
    "url": "assets/js/84.d50d3d09.js",
    "revision": "cdc0e25e4f147f635e4c04c409f99935"
  },
  {
    "url": "assets/js/85.1eed1486.js",
    "revision": "99a6b518c198712eba4adb916001461c"
  },
  {
    "url": "assets/js/86.1ab04b8d.js",
    "revision": "9218ab6fe0cc3e0d0cc9465ae1f04957"
  },
  {
    "url": "assets/js/87.392384e7.js",
    "revision": "b247ed9b2da1e82b477313aa886db306"
  },
  {
    "url": "assets/js/88.a95133cd.js",
    "revision": "4036de5ef3a7b6e9a318942ba6faf560"
  },
  {
    "url": "assets/js/89.213efaae.js",
    "revision": "fa74c388f721c266e3ae5f6edbb4bd85"
  },
  {
    "url": "assets/js/9.26319460.js",
    "revision": "b5a027c58f63f184432e7851068830a1"
  },
  {
    "url": "assets/js/90.ef03688f.js",
    "revision": "58920a350be92626cfd2cf15e640fd3d"
  },
  {
    "url": "assets/js/91.43930d52.js",
    "revision": "bff38c73ab05c14ddc5da88e4ba036e1"
  },
  {
    "url": "assets/js/92.ae5e9611.js",
    "revision": "b3faf9fd83b537307278864b0e5464ec"
  },
  {
    "url": "assets/js/93.3cdab647.js",
    "revision": "f66789e02a5ffd1afc485242e108c860"
  },
  {
    "url": "assets/js/94.72df7b53.js",
    "revision": "bd73044a9f346ca23782d615da42d4a4"
  },
  {
    "url": "assets/js/95.c8e36604.js",
    "revision": "e40ad2a5dfe1e25c058962cf86660287"
  },
  {
    "url": "assets/js/96.1ebdc00d.js",
    "revision": "2c67b7841bd6c48f9af68c6d95c8ffe4"
  },
  {
    "url": "assets/js/97.fa1ed9e7.js",
    "revision": "7e054747dd126fecc7e9d670794002b1"
  },
  {
    "url": "assets/js/98.939cb6ef.js",
    "revision": "56b3178533a666894baddadd8ab9bc06"
  },
  {
    "url": "assets/js/99.96c5a70e.js",
    "revision": "0cbc93b6dce3419f25775487b0d1407a"
  },
  {
    "url": "assets/js/app.84c88b57.js",
    "revision": "1067055bba375603bb5781924201a8a5"
  },
  {
    "url": "baidu_verify_codeva-GYcT5ujCTB.html",
    "revision": "05e79aba57b6dbeeb58f6aadc23f0074"
  },
  {
    "url": "desc.html",
    "revision": "f46e5deaa0b32c74a5465f7e57401fcd"
  },
  {
    "url": "guide/advance/ability-compatible.html",
    "revision": "3b8afd343db4d74cc203261e4141a4af"
  },
  {
    "url": "guide/advance/async-subpackage.html",
    "revision": "bc5eb1b9ec36b9d874620ec322f4d323"
  },
  {
    "url": "guide/advance/custom-output-path.html",
    "revision": "72a926d622c483691ffc39f9aa346f2d"
  },
  {
    "url": "guide/advance/dll-plugin.html",
    "revision": "e8d95670c94231a0a5d0c9ac40d23795"
  },
  {
    "url": "guide/advance/i18n.html",
    "revision": "f81fab30016db6683dc67d7f87ca65dd"
  },
  {
    "url": "guide/advance/image-process.html",
    "revision": "4c139d9d8d72efe3136d29bb862e4fe4"
  },
  {
    "url": "guide/advance/mixin.html",
    "revision": "5989556c2b6a6285617fcb2775e0b403"
  },
  {
    "url": "guide/advance/npm.html",
    "revision": "acc08a0cd161d56e73c5ea141affc99c"
  },
  {
    "url": "guide/advance/pinia.html",
    "revision": "2359fa01373e8bfb92e81ff3b275d5a8"
  },
  {
    "url": "guide/advance/platform.html",
    "revision": "83cd97f6ec8954c086b2b0361fc608c8"
  },
  {
    "url": "guide/advance/plugin.html",
    "revision": "7aecc3bfede3b13de6afc7a20e25e8af"
  },
  {
    "url": "guide/advance/progressive.html",
    "revision": "13fd4ea947dd5e9c0b3c4cb2ffff6ef4"
  },
  {
    "url": "guide/advance/provide-inject.html",
    "revision": "94f05629f5f4c9b7c9808d87e957eea8"
  },
  {
    "url": "guide/advance/resource-resolve.html",
    "revision": "cf43ecea0f34b0087d6ea2310d68d903"
  },
  {
    "url": "guide/advance/size-report.html",
    "revision": "e9b31045eeb57a567487eb0cec8c1a55"
  },
  {
    "url": "guide/advance/ssr.html",
    "revision": "a9a2ab6192f90ecf01f14e5e23ca3afc"
  },
  {
    "url": "guide/advance/store.html",
    "revision": "21fef840c6de0b5e61c831a76077e497"
  },
  {
    "url": "guide/advance/subpackage.html",
    "revision": "b43e2e4c902b2e4d10b58d5b8406b880"
  },
  {
    "url": "guide/advance/utility-first-css.html",
    "revision": "203f30c86d031caab57667d23d874a8c"
  },
  {
    "url": "guide/basic/class-style-binding.html",
    "revision": "b8f5d12016d754c0504aab2e06a8dda2"
  },
  {
    "url": "guide/basic/component.html",
    "revision": "c8e7cf6524386db839da0964dde4530a"
  },
  {
    "url": "guide/basic/conditional-render.html",
    "revision": "458a0e675d9fc7e4f4ed3a3d7cb10d2f"
  },
  {
    "url": "guide/basic/css.html",
    "revision": "a60840e3e0ab988469dd9701b8d9740f"
  },
  {
    "url": "guide/basic/event.html",
    "revision": "34a29012d67135507b22853092744b7a"
  },
  {
    "url": "guide/basic/ide.html",
    "revision": "84d9ce263667bac51aa966600d81f452"
  },
  {
    "url": "guide/basic/intro.html",
    "revision": "3564335cfab7690662f7e6981e28384c"
  },
  {
    "url": "guide/basic/list-render.html",
    "revision": "81564ae12132bfdeee22556dc29cf2aa"
  },
  {
    "url": "guide/basic/option-chain.html",
    "revision": "b8af0aca729f041f5d32e1df83383f8c"
  },
  {
    "url": "guide/basic/reactive.html",
    "revision": "fa1199d698f37cd18ab5e1cbd1fcde85"
  },
  {
    "url": "guide/basic/refs.html",
    "revision": "1ad3afc97da4858d06e82df08d4715ef"
  },
  {
    "url": "guide/basic/single-file.html",
    "revision": "82003549b10795b0c603a66854e2a89f"
  },
  {
    "url": "guide/basic/start.html",
    "revision": "06f28accbba57fc3d2696c3303a17ca0"
  },
  {
    "url": "guide/basic/template.html",
    "revision": "ac4adffc987166bd6b014e4874f9807b"
  },
  {
    "url": "guide/basic/two-way-binding.html",
    "revision": "9f94591106431eae092285cc63bf73b3"
  },
  {
    "url": "guide/composition-api/composition-api.html",
    "revision": "f372f2e4334ed4580d06f8fdfd741e9a"
  },
  {
    "url": "guide/composition-api/reactive-api.html",
    "revision": "a8f594693bbd5ae4af7644ea13f697fb"
  },
  {
    "url": "guide/extend/api-proxy.html",
    "revision": "13330ecd6678b2e40e034d8ad425029c"
  },
  {
    "url": "guide/extend/fetch.html",
    "revision": "6a54e8095f85d420cd97707a5d3684c7"
  },
  {
    "url": "guide/extend/index.html",
    "revision": "258dede7e9407b44d9998bf7fe1fd3b0"
  },
  {
    "url": "guide/extend/mock.html",
    "revision": "2951d26e9b525fb4c94afabf4ac9924f"
  },
  {
    "url": "guide/migrate/2.7.html",
    "revision": "fc84b08b7d29082e1dbb1999d900a704"
  },
  {
    "url": "guide/migrate/2.8.html",
    "revision": "28587490b791a1b8ba35c7d92f12a6de"
  },
  {
    "url": "guide/migrate/2.9.html",
    "revision": "658e207bc34b8a18cb8ed68442c62712"
  },
  {
    "url": "guide/migrate/mpx-cli-3.html",
    "revision": "f91fdb6ac9c54c8c865d19637c7ee591"
  },
  {
    "url": "guide/platform/index.html",
    "revision": "b0af12d7eaf7882a8aea01d8202c4d02"
  },
  {
    "url": "guide/platform/miniprogram.html",
    "revision": "2b5ed743d1a4eeab70f2b4f8051eefba"
  },
  {
    "url": "guide/platform/rn.html",
    "revision": "cb10026541b586deac1fc9c234328e78"
  },
  {
    "url": "guide/platform/web.html",
    "revision": "e99c298705c937e4965c229cd7e4a2b9"
  },
  {
    "url": "guide/tool/e2e-test.html",
    "revision": "858693cd05b55bc582f420643ef9e514"
  },
  {
    "url": "guide/tool/ts.html",
    "revision": "a1b3d19233cad159d0bd946a2ea3eb41"
  },
  {
    "url": "guide/tool/unit-test.html",
    "revision": "bf791feac87c5709dfb9e3fd326c99fd"
  },
  {
    "url": "guide/understand/compile.html",
    "revision": "6e9a16d929784bcdbe34ca2564c47a18"
  },
  {
    "url": "guide/understand/runtime.html",
    "revision": "c7008c7a29fefb544fb600bd71677b7a"
  },
  {
    "url": "index.html",
    "revision": "51c2b45fb4b6fac444845411d55acbca"
  },
  {
    "url": "logo.png",
    "revision": "b362e51deb26ea4ff1d0daa6da1e7c44"
  },
  {
    "url": "rn-api.html",
    "revision": "41b9df161419f392a9a40e6b7b162ae3"
  },
  {
    "url": "rn-component.html",
    "revision": "e0533defbccf789f8f8e2c15ae3ebd22"
  },
  {
    "url": "rn-style.html",
    "revision": "163003bbcbe6b7665c2f420daee35296"
  },
  {
    "url": "rn-template.html",
    "revision": "71cca96a9f67d8ddb84cb284342b8329"
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
