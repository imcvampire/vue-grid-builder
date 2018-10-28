<template>
  <grid-layout
    :layout.sync="layout"
    :col-num="6"
    :row-height="30"
    :is-draggable="isDraggable"
    :is-resizable="false"
    :is-mirrored="false"
    :vertical-compact="true"
    :use-css-transforms="true"
    :margin="[0,0]"
  >
    <div class="container vue-drag-select" @mousedown="onMouseDown" ref="container">
      <grid-item
        class="cell"
        :class="getClasses(item)"
        v-for="item in layout"
        :data-item="item"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :key="item.i"
      >
        {{item.i}}
      </grid-item>
      <slot :selectedItems="selectedItems"/>
      <div v-if="mouseDown" class="vue-drag-select-box" :style="selectionBoxStyling"></div>
    </div>
  </grid-layout>
</template>

<script>
import VueGridLayout from 'vue-grid-layout'

const nGrids = 6 * 12

const createGrid = ({ x, y, w, h, i, selected = false }) => ({
  x,
  y,
  w,
  h,
  i,
  selected,
})

export default {
  components: {
    VueGridLayout,
  },
  name: 'GridBuilder',
  props: {
    msg: String,
  },
  data() {
    return {
      layout: new Array(nGrids).fill(null).map((item, index) =>
        createGrid({
          x: index % 6,
          y: Math.floor(index / 6),
          w: 1,
          h: 1,
          i: index,
        }),
      ),
      isDraggable: false,
      mouseDown: false,
      startPoint: null,
      endPoint: null,
      selectedItems: [],
    }
  },
  computed: {
    selectionBox() {
      // Only set styling when necessary
      if (!this.mouseDown || !this.startPoint || !this.endPoint) return {}

      const clientRect = this.$el.getBoundingClientRect()
      const scroll = this.getScroll()

      // Calculate position and dimensions of the selection box
      const left = Math.min(this.startPoint.x, this.endPoint.x) - clientRect.left - scroll.x
      const top = Math.min(this.startPoint.y, this.endPoint.y) - clientRect.top - scroll.y
      const width = Math.abs(this.startPoint.x - this.endPoint.x)
      const height = Math.abs(this.startPoint.y - this.endPoint.y)

      // Return the styles to be applied
      return {
        left,
        top,
        width,
        height,
      }
    },
    selectionBoxStyling() {
      // Only set styling when necessary
      if (!this.mouseDown || !this.startPoint || !this.endPoint) return {}

      const { left, top, width, height } = this.selectionBox

      // Return the styles to be applied
      return {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }
    },
  },
  methods: {
    getScroll() {
      // If we're on the server, default to 0,0
      if (typeof document === 'undefined') {
        return {
          x: 0,
          y: 0,
        }
      }

      return {
        x: this.$el.scrollLeft || document.body.scrollLeft || document.documentElement.scrollLeft,
        y: this.$el.scrollTop || document.body.scrollTop || document.documentElement.scrollTop,
      }
    },
    getClasses(item) {
      // console.log(this.selectedItems.map(_item => _item.i))
      const isActive = !!this.selectedItems.find(
        selectedItem => parseInt(selectedItem.i, 10) === item.i,
      )
      return {
        item: true,
        active: isActive,
      }
    },
    onMouseDown(event) {
      // Ignore right clicks
      if (event.button !== 0) return

      // Register begin point
      this.mouseDown = true
      this.startPoint = {
        x: event.pageX,
        y: event.pageY,
      }

      // Start listening for mouse move and up events
      window.addEventListener('mousemove', this.onMouseMove)
      window.addEventListener('mouseup', this.onMouseUp)
    },
    onMouseMove(event) {
      // Update the end point position
      if (this.mouseDown) {
        this.endPoint = {
          x: event.pageX,
          y: event.pageY,
        }
        const children = this.$children[0].$children
        if (children) {
          this.selectedItems = Array.from(children).filter(item =>
            this.isItemSelected(item.$el || item),
          )
        }
      }
    },
    onMouseUp() {
      // Clean up event listeners
      window.removeEventListener('mousemove', this.onMouseMove)
      window.removeEventListener('mouseup', this.onMouseUp)

      // Reset state
      this.mouseDown = false
      this.startPoint = null
      this.endPoint = null
    },
    isItemSelected(el) {
      if (el.classList.contains('cell')) {
        const boxA = this.selectionBox
        const boxB = {
          top: el.offsetTop,
          left: el.offsetLeft,
          width: el.clientWidth,
          height: el.clientHeight,
        }
        return !!(
          boxA.left <= boxB.left + boxB.width &&
          boxA.left + boxA.width >= boxB.left &&
          boxA.top <= boxB.top + boxB.height &&
          boxA.top + boxA.height >= boxB.top
        )
      }
      return false
    },
  },
  mounted() {
    this.$children[0].$children.forEach(child => {
      child.$on('click', () => {
        const included = this.selectedItems.find(item => child.$el === item.$el)
        if (included) {
          this.selectedItems = this.selectedItems.filter(item => child.$el !== item.$el)
        } else {
          this.selectedItems.push(child)
        }
      })
    })
  },
  beforeDestroy() {
    // Remove event listeners
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)

    this.$children.forEach(child => {
      child.$off('click')
    })
  },
}
</script>

<style scoped>
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

.container {
  width: 330;
}

/* Custom styling */

.item {
  display: inline-flex;
  width: 50px;
  height: 50px;
  background-color: whitesmoke;
  border: 1px solid;
}

.item.active {
  background-color: rgb(0, 162, 255);
  color: #fff;
  border: none;
}

.cell {
  border: 1px solid;
  text-align: center;
}

.vue-drag-select {
  position: relative;
  user-select: none;
}

.vue-drag-select-box {
  position: absolute;
  background: rgba(0, 162, 255, 0.4);
  z-index: 99;
}
</style>
