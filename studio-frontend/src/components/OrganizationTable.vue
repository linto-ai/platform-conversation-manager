<template>
  <table
    class="table-grid"
    style="grid-template-columns: auto 1fr 1fr 1fr auto; width: 100%">
    <OrganizationTableHeaders
      @list_sort_by="sortBy"
      :sortListKey="sortListKey"
      :sortListDirection="sortListDirection" />
    <tbody>
      <div class="table-loader" v-if="loading">
        <Loading />
      </div>
      <OrganizationTableLine
        v-for="organization in organizationList"
        v-model="p_selectedOrganizations"
        :linkTo="linkTo"
        :key="organization.id"
        :organization="organization" />
    </tbody>
  </table>
</template>
<script>
import OrganizationTableHeaders from "./OrganizationTableHeaders.vue"
import OrganizationTableLine from "./OrganizationTableLine.vue"
import Loading from "./Loading.vue"
export default {
  props: {
    organizationList: {
      type: Array,
      required: true,
    },
    linkTo: {
      type: Object,
      required: false,
    },
    value: {
      //selectedOrganizations
      type: Array,
      required: true,
    },
    sortListKey: {
      type: String,
      required: true,
    },
    sortListDirection: {
      type: String,
      required: true,
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {
    sortBy(event) {
      this.$emit("list_sort_by", event)
    },
  },
  computed: {
    p_selectedOrganizations: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit("input", value)
      },
    },
  },
  components: { OrganizationTableHeaders, OrganizationTableLine, Loading },
}
</script>
