import { defineStore } from "@mpxjs/pinia";

const store = defineStore('store', {
  state: () => {
    return {
      count: 0,
    };
  },
  actions: {
    increment() {
      this.count += 2;
    },
  },
});

export default store
