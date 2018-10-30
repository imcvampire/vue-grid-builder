<template>
  <div :class="$style.dropdown">
    <button :class="$style.dropBtn">Menu</button>
    <div :class="$style.dropdownContent">
      <a @click="$emit('delete')">Delete</a>
      <a @click="$emit('reselect')">Reselect component</a>
    </div>
  </div>
</template>

<style module>
.dropBtn {
  background-color: #4caf50;
  color: white;
  padding: 4px;
  border: none;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdownContent {
  display: none;
  position: absolute;
  background-color: #f1f1f1;
  min-width: 50px;
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.dropdownContent a {
  color: black;
  padding: 4px;
  text-decoration: none;
  display: block;
}

.dropdownContent a:hover {
  background-color: #ddd;
}

.dropdown:hover .dropdownContent {
  display: block;
}

.dropdown:hover .dropBtn {
  background-color: #3e8e41;
}
</style>
