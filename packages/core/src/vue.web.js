// import Vue from 'vue'
import { createApp } from "vue";

import install from "./vuePlugin";

const app = createApp({});

app.use(install)

// Vue.use(install);

export default app;
