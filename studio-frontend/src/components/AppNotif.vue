<template>
  <div
    id="app-notif"
    class="flex row"
    :class="[status, showNotif ? 'visible' : 'closed']">
    <div class="flex row flex1 app-notif-msg">
      <span class="app-notif__icon" :class="`app-notif__icon-${status}`"></span>
      <span class="app-notif__message">{{ message }}</span>
    </div>
    <div class="flex row app-notif-close" v-if="!cantBeClosed">
      <button class="close-notif" @click="close()"></button>
    </div>
  </div>
</template>
<script>
import { bus } from "../main.js"
export default {
  data() {
    return {
      message: "",
      timeout: null,
      status: "",
      showNotif: false,
      redirect: false,
      cantBeClosed: false,
    }
  },
  mounted() {
    bus.$on("app_notif", (data) => {
      this.message = data.message
      this.timeout = data.timeout || 4000
      this.status = data.status
      this.cantBeClosed = data?.cantBeClosed ?? false
      if (data?.redirect) {
        this.$router.push({ name: data?.redirect })
      }
      this.show()
    })
  },
  beforeDestroy() {
    bus.$off("app_notif")
  },
  methods: {
    show() {
      this.showNotif = true
      if (this.timeout !== null && this.timeout > 0) {
        setTimeout(() => {
          this.close()
        }, this.timeout)
      }
    },
    close() {
      this.showNotif = false
    },
  },
}
</script>
