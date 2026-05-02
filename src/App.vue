<script setup lang="ts">
import { RouterView } from 'vue-router'
import Layout from '@/components/Layout.vue'
</script>

<template>
  <Layout>
    <RouterView />
  </Layout>
</template>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
