<template>
  <div class="container">
    123123
    <ParentLayout/>
  </div>
</template>


<script>
import ParentLayout from '@parent-theme/layouts/Layout.vue'

export default {
  components: {
    ParentLayout
  }
}
</script>

<style>
.test {
  width: 200px;
  height: 200px;
  background: red;
}
</style>
