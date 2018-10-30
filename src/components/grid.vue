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
    <div
      ref="container"
      class="container vue-drag-select"
      @mousedown="onMouseDown"
    >
      <grid-item
        v-for="item in layout"
        :class="getClasses(item)"
        :data-item="item"
        :ref="'item'"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :key="item.i"
        class="cell"
      >
        <div v-if="debug">{{ item.i }}</div>
        <div v-if="item.selected">
          <div v-if="item.component == null">
            <div
              v-for="option in selectableComponents"
              :class="$style.option"
              :key="option.name"
              @click="selectComponent(option, item.i)"
            >
              <img
                :class="$style.optionImage"
                :src="option.image"
              >
              <div :class="$style.optionText">{{ option.name }}</div>
            </div>
          </div>
          <div v-else>
            <component :is="item.component"/>
            <menu-component
              :class="$style.menu"
              @delete="deleteSelectedSelection"
              @reselect="() => reselectSelection(item)"
            />
          </div>
        </div>
      </grid-item>
      <div
        v-if="mouseDown"
        :style="selectionBoxStyling"
        class="vue-drag-select-box"
      />
    </div>
  </grid-layout>
</template>

<script>
import VueGridLayout from 'vue-grid-layout'

import Menu from './menu.vue'

const nGrids = 6 * 12

const createGrid = ({ x, y, w = 1, h = 1, i, selected = false, component }) => ({
  x,
  y,
  w,
  h,
  i,
  selected,
  component,
})

export default {
  name: 'GridBuilder',
  components: {
    VueGridLayout,
    MenuComponent: Menu,
  },
  props: {
    debug: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      layout: new Array(nGrids).fill(null).map((item, index) =>
        createGrid({
          x: index % 6,
          y: Math.floor(index / 6),
          i: index,
        }),
      ),
      isDraggable: false,
      isDuplicated: false,
      mouseDown: false,
      startPoint: null,
      endPoint: null,

      selectableComponents: [
        {
          name: 'input',
          image: '/download.png',
          component: 'input',
        },
        {
          name: 'select',
          component: 'select',
        },
      ],
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
  mounted() {
    // this.$children[0].$children.forEach(child => {
    //   child.$on('click', () => {})
    // })
  },
  beforeDestroy() {
    // Remove event listeners
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)

    this.$children.forEach(child => {
      child.$off('click')
    })
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
      return {
        item: true,
        active: item.selected,
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
        /* eslint-disable no-console */
        Array.from(this.$refs.item).forEach(item => {
          if (this.isItemSelected(item.$el || item)) {
            const i = this.layout.findIndex(layoutItem => layoutItem.i === item.i)
            if (this.layout[i].w !== 1 && this.layout[i].h !== 1) {
              this.$set(this, 'isDuplicated', true)
              this.onMouseUp()
            }
            this.$set(this.layout[i], 'selected', true)
          }
        })
      }
    },
    isItemSelected(el) {
      if (el.classList.contains('item')) {
        const boxA = this.selectionBox
        const boxB = el.getBoundingClientRect()
        return !!(
          boxA.left <= boxB.left + boxB.width &&
          boxA.left + boxA.width >= boxB.left &&
          boxA.top <= boxB.top + boxB.height &&
          boxA.top + boxA.height >= boxB.top
        )
      }
      return false
    },
    onMouseUp() {
      const selected = this.layout.filter(item => item.selected && item.w === 1 && item.h === 1)
      if (selected.length && !this.isDuplicated) {
        const minItem = selected.find(
          selection => selection.i === Math.min(...selected.map(item => item.i)),
        )
        const maxItem = selected.find(
          selection => selection.i === Math.max(...selected.map(item => item.i)),
        )
        const newItem = {
          ...minItem,
          w: (maxItem.i % 6) - (minItem.i % 6) + 1,
          h: Math.floor(maxItem.i / 6) - Math.floor(minItem.i / 6) + 1,
        }
        const newLayout = this.layout
          .filter(item => !item.selected || item.w > 1 || item.h > 1)
          .concat(newItem)
        this.$set(this, 'layout', newLayout)
      }
      if (this.isDuplicated) {
        selected.forEach(item => {
          const i = this.layout.findIndex(layoutItem => layoutItem.i === item.i)
          this.$set(this.layout[i], 'selected', false)
        })
      }

      // Clean up event listeners
      window.removeEventListener('mousemove', this.onMouseMove)
      window.removeEventListener('mouseup', this.onMouseUp)

      // Reset state
      this.isDuplicated = false
      this.mouseDown = false
      this.startPoint = null
      this.endPoint = null
    },

    selectComponent(option, itemId) {
      const item = this.layout.find(_ => _.i === itemId)
      console.log(item)
      if (item == null) return

      this.$set(item, 'component', option.component)
    },

    deleteSelectedSelection() {
      console.log('delete')
    },
    reselectSelection(item) {
      this.$set(item, 'component', null)
    },
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
  width: 330px;
}

/* Custom styling */

.item {
  display: inline-flex;
  width: 50px;
  height:
