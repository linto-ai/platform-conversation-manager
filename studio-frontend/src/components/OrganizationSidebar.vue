<template>
  <aside class="organization-sidebar flex col gap-medium">
    <div style="padding-left: 1rem !important" v-if="organizationPage">
      <h3 class="fullwidth no-padding">
        {{ currentOrganization.name }}
      </h3>
    </div>
    <!-- <OrganizationSelector
      v-if="organizationPage"
      :currentOrganizationScope="currentOrganizationScope"
      :userOrganizations="userOrganizations"
      :currentOrganization="currentOrganization" /> -->
    <nav class="tabs col" v-if="organizationPage">
      <router-link
        :to="{ name: 'inbox' }"
        class="flex row align-center gap-medium tab">
        <span class="icon home"></span>
        <span class="tab__label">{{ $t("navigation.tabs.inbox") }}</span>
      </router-link>
      <router-link
        :to="{ name: 'explore' }"
        class="flex row align-center gap-medium tab">
        <span class="icon discover"></span>
        <span class="tab__label">{{ $t("navigation.tabs.explore") }}</span>
      </router-link>
    </nav>
    <!-- <div class="sidebar-divider"></div> -->
    <h3
      class="fullwidth no-padding"
      style="padding-left: 1rem !important"
      v-if="organizationPage">
      {{ userName }}
    </h3>
    <nav class="tabs col" v-if="organizationPage">
      <router-link
        :to="{ name: 'shared with me' }"
        class="flex row align-center gap-medium tab">
        <span class="icon share"></span>
        <span class="tab__label">{{ $t("navigation.tabs.shared") }}</span>
      </router-link>
      <router-link
        :to="{ name: 'favorites' }"
        class="flex row align-center gap-medium tab">
        <span class="icon star"></span>
        <span class="tab__label">{{ $t("navigation.tabs.favorites") }}</span>
      </router-link>
    </nav>
    <slot></slot>
  </aside>
</template>
<script>
import { Fragment } from "vue-fragment"

import { bus } from "../main.js"
import { userName } from "@/tools/userName"

import OrganizationSelector from "../components/OrganizationSelector.vue"

export default {
  props: {
    organizationPage: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {}
  },
  computed: {
    currentOrganization() {
      return this.$store.state.currentOrganization
    },
    currentOrganizationScope() {
      return this.currentOrganization._id
    },
    userOrganizations() {
      return this.$store.state.userOrganizations
    },
    selectedTab() {
      return this.$route.name
    },
    userInfo() {
      return this.$store.state.userInfo
    },
    userName() {
      return userName(this.userInfo)
    },
  },
  mounted() {},
  methods: {},
  components: { Fragment, OrganizationSelector },
}
</script>
