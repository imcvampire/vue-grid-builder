<template>
  <div id="app">
    <GridBuilder
      debug
    />
  </div>
</template>

<script>
import GridBuilder from './components/grid.vue'

export default {
  name: 'App',
  components: {
    GridBuilder,
  },
}
</script>

<style>
*,
*:before,
*:after {
  box-sizing: inherit;
}

html {
  box-sizing: border-box;
  user-select: none;
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
