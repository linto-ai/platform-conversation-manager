<template>
  <Loading></Loading>
</template>
<script>
import Loading from "@/components/Loading.vue"
import { getOidcToken } from "@/api/user.js"
import { setCookie } from "@/tools/setCookie.js"

export default {
  props: {},
  data() {
    return {}
  },
  mounted() {
    this.fetchToken()
  },
  methods: {
    async fetchToken() {
      let res = await getOidcToken()

      if (res.status == "error") {
        this.$router.replace({ name: "login", query: { error: "oidc" } })
      }

      if (res.status == "success") {
        setCookie("userId", res.data.user_id, 7)
        setCookie("authToken", res.data.auth_token, 7)
        setCookie("cm_orga_scope", "")

        if (this.$route?.query?.next) {
          window.location.href = this.$route?.query?.next
        } else {
          window.location.href = "/"
        }
      }
    },
  },
  components: {
    Loading,
  },
}
</script>
