<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

interface FormItem {
  prop: string
  label: string
  type: 'input' | 'textarea' | 'select' | 'date' | 'datetime' | 'number' | 'switch'
  placeholder?: string
  options?: { label: string; value: any }[]
  rules?: FormRules
  disabled?: boolean
  rows?: number
}

interface Props {
  model: Record<string, any>
  formItems: FormItem[]
  labelWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  labelWidth: '120px'
})

const emit = defineEmits<{
  'update:model': [value: Record<string, any>]
  submit: []
}>()

const formRef = ref<FormInstance>()

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  emit('submit')
}

const handleReset = () => {
  formRef.value?.resetFields()
}

const validate = () => {
  return formRef.value?.validate()
}

const resetFields = () => {
  formRef.value?.resetFields()
}

defineExpose({
  validate,
  resetFields
})
</script>

<template>
  <el-form
    ref="formRef"
    :model="model"
    :label-width="labelWidth"
    class="common-form"
  >
    <el-form-item
      v-for="item in formItems"
      :key="item.prop"
      :label="item.label"
      :prop="item.prop"
      :rules="item.rules"
    >
      <el-input
        v-if="item.type === 'input'"
        v-model="model[item.prop]"
        :placeholder="item.placeholder"
        :disabled="item.disabled"
      />
      <el-input
        v-else-if="item.type === 'textarea'"
        v-model="model[item.prop]"
        type="textarea"
        :rows="item.rows || 3"
        :placeholder="item.placeholder"
        :disabled="item.disabled"
      />
      <el-select
        v-else-if="item.type === 'select'"
        v-model="model[item.prop]"
        :placeholder="item.placeholder"
        :disabled="item.disabled"
        style="width: 100%"
      >
        <el-option
          v-for="opt in item.options"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-date-picker
        v-else-if="item.type === 'date'"
        v-model="model[item.prop]"
        type="date"
        :placeholder="item.placeholder"
        :disabled="item.disabled"
        style="width: 100%"
      />
      <el-date-picker
        v-else-if="item.type === 'datetime'"
        v-model="model[item.prop]"
        type="datetime"
        :placeholder="item.placeholder"
        :disabled="item.disabled"
        style="width: 100%"
      />
      <el-input-number
        v-else-if="item.type === 'number'"
        v-model="model[item.prop]"
        :placeholder="item.placeholder"
        :disabled="item.disabled"
        style="width: 100%"
      />
      <el-switch
        v-else-if="item.type === 'switch'"
        v-model="model[item.prop]"
        :disabled="item.disabled"
      />
    </el-form-item>
    <el-form-item>
      <slot name="actions">
        <el-button type="primary" @click="handleSubmit">提交</el-button>
        <el-button @click="handleReset">重置</el-button>
      </slot>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.common-form {
  padding: 20px;
}
</style>
