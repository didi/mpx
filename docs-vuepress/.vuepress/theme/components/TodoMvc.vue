<template>
  <div id="todo"></div>
</template>

<script>
export default {
  // data: {
  //     rawHtml: '<div id="app"></div>'
  // },

  mounted() {
    let script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://dpubstatic.udache.com/static/dpubimg/jZgwlFIBjH/app.js";
    document.getElementById("todo").appendChild(script);
    //   this.loadJs(
    //     "https://dpubstatic.udache.com/static/dpubimg/jZgwlFIBjH/app.js"
    //   ).then(() => {
    //     console.log("加载成功");
    //   });
  },
  methods: {
    // loadJs(src) {
    //   return new Promise((resolve, reject) => {
    //     let script = document.createElement("script");
    //     script.type = "text/javascript";
    //     script.src = src;
    //     document.getElementById("app").appendChild(script);

    //     script.onload = () => {
    //       resolve();
    //     };
    //     script.onerror = () => {
    //       reject();
    //     };
    //   });
    // },
  },
};
</script>

<style lang="stylus" scoped>
#todo
  width 100px
  hetght 100px
</style>