<template>
  <div class="flex align-center user-info-inline gap-small flex1">
    <img :src="imgFullPath(user.img)" class="user-info-inline__avatar" />
    <div v-if="user" class="flex col align-top flex1 text-cut">
      <div class="user-info-inline__name flex align-top fullwidth gap-tiny">
        <span
          class="flex1 text-cut"
          :title="userData.firstname + ' ' + userData.lastname"
          >{{ userData.firstname }} {{ userData.lastname }}</span
        >
        <span class="user-info-inline__external" v-if="external">External</span>
      </div>
      <div class="user-info-inline__email text-cut">({{ userData.email }})</div>
    </div>
    <div v-else>-</div>
    <slot></slot>
  </div>
</template>
<script>
import { getUserInfo } from "../tools/getUserInfo.js"
export default {
  props: {
    userId: { required: true },
    user: { required: false },
    external: { required: false, default: false },
  },
  data() {
    return {
      userData: this.user,
    }
  },
  watch: {
    user: {
      handler: async function (val) {
        if (val) {
          this.userData = val
        } else {
          this.userData = await getUserInfo(this.userId)
        }
      },
      immediate: true,
    },
  },
  methods: {
    imgFullPath(imgPath) {
      return process.env.VUE_APP_PUBLIC_MEDIA + "/" + imgPath
    },
  },
}
</script>
