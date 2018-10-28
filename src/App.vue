<template>
  <div id="app">
    <GridBuilder />
  </div>
</template>

<script>
import GridBuilder from './components/grid.vue'

export default {
  name: 'app',
  components: {
    GridBuilder,
  },
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
