<template>
  <aside class="organization-sidebar flex col gap-medium">
    <nav class="tabs col">
      <router-link
        :to="{ name: 'backoffice' }"
        exact
        class="flex row align-center gap-medium tab">
        <span class="icon home"></span>
        <span class="tab__label">{{ $t("backoffice.navigation.home") }}</span>
      </router-link>
      <router-link
        v-if="isSuperAdministrator"
        :to="{ name: 'backoffice-userList' }"
        class="flex row align-center gap-medium tab">
        <span class="icon profile"></span>
        <span class="tab__label">{{ $t("backoffice.navigation.users") }}</span>
      </router-link>
      <router-link
        v-if="isAtLeastSystemAdministrator"
        :to="{ name: 'backoffice-organizationList' }"
        class="flex row align-center gap-medium tab">
        <span class="icon work"></span>
        <span class="tab__label">{{
          $t("backoffice.navigation.organisations")
        }}</span>
      </router-link>
    </nav>
  </aside>
</template>
<script>
import { platformRoleMixin } from "@/mixins/platformRole.js"
export default {
  mixins: [platformRoleMixin],
  props: {},
  data() {
    return {}
  },
  mounted() {},
  methods: {},
  components: {},
}
</script>
