<template>
  <tr @click="selectOrganization">
    <td>
      <Checkbox
        class="line-selector"
        v-model="p_selectedOrganizations"
        :checkboxValue="id"></Checkbox>
    </td>
    <td>
      <router-link :to="to">{{ creationDateFormatted }}</router-link>
    </td>
    <td>
      <router-link :to="to">{{ name }}</router-link>
    </td>
    <td>{{ userNumber }}</td>
    <td>
      <button @click="editOrganization">
        <span class="icon edit"></span>
        <span class="label">{{ $t("orgaTable.edit_button_label") }}</span>
      </button>
    </td>
  </tr>
</template>
<script>
import { organizationModelMixin } from "@/mixins/organizationModel"
import router from "../routers/app-router"

import Checkbox from "@/components/Checkbox.vue"

export default {
  mixins: [organizationModelMixin],
  props: {
    organization: {
      type: Object,
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
  },
  data() {
    return {}
  },
  mounted() {},
  computed: {
    to() {
      return {
        ...this.linkTo,
        params: { organizationId: this.id },
      }
    },
    p_selectedOrganizations: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit("input", value)
      },
    },
  },
  methods: {
    editOrganization() {
      router.push(this.to)
    },
    selectOrganization() {
      this.p_selectedOrganizations = this.p_selectedOrganizations.includes(
        this.id,
      )
        ? this.p_selectedOrganizations.filter((id) => id !== this.id)
        : [...this.p_selectedOrganizations, this.id]
    },
  },
  components: {
    Checkbox,
  },
}
</script>
