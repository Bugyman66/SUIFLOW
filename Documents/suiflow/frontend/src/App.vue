<template>
  <div>
    <nav class="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
      <div class="font-bold text-lg">Suiflow</div>
      <div>
        <router-link to="/" class="mr-4 hover:underline">Home</router-link>
        <router-link to="/admin/dashboard" class="hover:underline">Admin Dashboard</router-link>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style>
body {
  font-family: 'Inter', sans-serif;
}
</style>