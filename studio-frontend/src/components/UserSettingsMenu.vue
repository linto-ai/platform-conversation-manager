<template>
  <CustomSelect
    :valueText="UserName"
    :value="UserName"
    :icon="imgUrl"
    :iconText="$t('navigation.account.avatar_title')"
    :aria-label="$t('navigation.account.title')"
    iconType="img"
    id="user-menu"
    menuPosition="left"
    :badge="badgeValue"
    @input="clickMenu"
    :options="selectOptions" />
  <!--
    <div
      class="user-menu-notification"
      v-if="
        accountNotifications.updatePassword ||
        accountNotifications.inviteAccount ||
        !userInfo.emailIsVerified
      ">
      1
    </div>
  </div>
  -->
</template>
<script>
import { bus } from "../main.js"
import { userName } from "@/tools/userName.js"
import CustomSelect from "@/components/CustomSelect.vue"

import { platformRoleMixin } from "@/mixins/platformRole.js"

export default {
  mixins: [platformRoleMixin],
  props: {
    userInfo: { type: Object, required: true },
  },
  data() {
    return {
      userMenuOpened: false,
      userId: "",
    }
  },
  mounted() {
    bus.$on("navigation", this.closeMenu)
  },
  beforeCreate() {
    bus.$off("navigation", this.closeMenu)
  },
  computed: {
    user() {
      return this.$store.state.userInfo
    },
    imgUrl() {
      const imageUrl = this.userInfo.img ?? "pictures/default.jpg"
      return `${process.env.VUE_APP_PUBLIC_MEDIA}/${imageUrl}`
    },
    currentRoute() {
      return this.$route
    },
    accountNotifications() {
      return (
        this.userInfo.accountNotifications ?? {
          updatePassword: false,
          inviteAccount: false,
        }
      )
    },
    UserName() {
      return userName(this.user)
    },
    badgeValue() {
      if (
        this.accountNotifications?.updatePassword ||
        this.accountNotifications?.inviteAccount ||
        !this.userInfo.emailIsVerified
      ) {
        return 1
      } else {
        return null
      }
    },
    selectOptions() {
      if (this.isBackofficePage) {
        return {
          backOffice: [
            {
              value: "user_interface",
              text: this.$t("navigation.backoffice.return_link"),
              icon: "back",
              iconText: this.$t("navigation.backoffice.return_link"),
            },
          ],
          user: [
            {
              value: "account",
              text: this.$t("navigation.account.account_link"),
              icon: "account",
              iconText: "Account",
              badge: this.badgeValue,
            },
            {
              value: "logout",
              text: this.$t("navigation.account.logout"),
              icon: "logout",
              iconText: "Logout",
            },
          ],
        }
      } else {
        let res = {}

        if (this.isSessionOperator || this.isSystemAdministrator) {
          res["backOffice"] = [
            {
              value: "backoffice",
              text: this.$t("navigation.backoffice.link_title"),
              icon: "settings",
              iconText: "Backoffice",
            },
          ]
        }

        res["medias"] = [
          {
            value: "shared",
            text: this.$t("navigation.tabs.shared"),
            icon: "share",
            iconText: "share",
          },
          {
            value: "favorites",
            text: this.$t("navigation.tabs.favorites"),
            icon: "star",
            iconText: "Favorites",
          },
        ]

        res["user"] = [
          {
            value: "account",
            text: this.$t("navigation.account.account_link"),
            icon: "account",
            iconText: "Account",
            badge: this.badgeValue,
          },
          {
            value: "logout",
            text: this.$t("navigation.account.logout"),
            icon: "logout",
            iconText: "Logout",
          },
        ]

        return res
      }
    },
  },
  methods: {
    closeMenu() {
      this.userMenuOpened = false
    },
    clickMenu(value) {
      if (value === "account") {
        this.$router.push(`/interface/user/settings`)
      }
      if (value === "favorites") {
        this.$router.push({ name: "favorites" })
      }
      if (value === "shared") {
        this.$router.push({ name: "shared with me" })
      }
      if (value === "logout") {
        this.logout()
      }
      if (value === "backoffice") {
        this.$router.push({ name: "backoffice" })
      }
      if (value === "user_interface") {
        this.$router.push({ name: "inbox" })
      }
    },
    capitalizeFirstLetter(string) {
      return this.$options.filters.CapitalizeFirstLetter(string)
    },
    async logout() {
      this.$options.filters.logout()
    },
  },
  components: {
    CustomSelect,
  },
}
</script>
