<template>
  <grid-layout
    :layout.sync="layout"
    :col-num="6"
    :row-height="60"
    :max-rows="12"
    :is-mirrored="false"
    :vertical-compact="true"
    :use-css-transforms="true"
    :margin="[0,0]"
    :auto-size="false"
    @layout-changed="layoutUpdatedEvent"
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
        :is-draggable="item.isDraggable"
        :is-resizable="item.isResizable"
        class="cell"
        @resize="resizeEvent"
        @move="moveEvent"
        @resized="resizedEvent"
        @moved="movedEvent"
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
              @delete="() => deleteSelectedSelection(item)"
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

const createGrid = ({x, y, w = 1, h = 1, i, selected = false, included = false, merged = false, component, isDraggable = false, isResizable = false}) => ({
  x,
  y,
  w,
  h,
  i,
  selected,
  component,
  included,
  merged,
  isDraggable,
  isResizable,
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
      isResizable: false,
      isDuplicated: false,
      isMoving: false,
      mouseDown: false,
      startPoint: null,
      endPoint: null,
      movingItem: null,
      needRemoveItem: null,
      needAddItem: null,

      includedComponent: [],

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

      const {left, top, width, height} = this.selectionBox

      // Return the styles to be applied
      return {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }
    },
  },
  watch: {
    movingItem(newVal, oldVal) {
      console.log(newVal, oldVal)
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
        active: item.included,
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
          const i = this.layout.findIndex(layoutItem => layoutItem.i === item.i)
          if (this.isItemSelected(item.$el || item)) {
            if (this.layout[i].w !== 1 && this.layout[i].h !== 1) {
              this.$set(this, 'isDuplicated', true)
              this.onMouseUp()
            }
          }
          if (!this.layout[i].merged) this.$set(this.layout[i], 'included', this.isItemSelected(item.$el || item))
        })
      }
    },
    isItemSelected(el) {
      if (el.classList.contains('item')) {
        const boxA = this.selectionBox
        const boxB = el.getBoundingClientRect()
        return (
          boxA.left <= boxB.left + boxB.width &&
          boxA.top <= boxB.top + boxB.height &&
          boxA.left + boxA.width >= boxB.left &&
          boxA.top + boxA.height >= boxB.top
        )
      }
      return false
    },
    onMouseUp() {
      const selected = this.layout.filter(item => item.included && !item.merged && item.w === 1 && item.h === 1)
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
          merged: true,
          selected: true,
          isDraggable: true,
          isResizable: true,
        }
        this.$set(this, 'includedComponent', this.includedComponent.concat(minItem.i))
        console.log('set include', this.includedComponent)
        const newLayout = this.layout
          .filter(item => !item.included || item.merged)
          .concat(newItem)
        this.$set(this, 'layout', newLayout)
      }
      if (this.isDuplicated) {
        selected.forEach(item => {
          const i = this.layout.findIndex(layoutItem => layoutItem.i === item.i)
          this.$set(this.layout[i], 'included', false)
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
    deleteSelectedSelection(item) {
      let layout = this.layout.filter(_ => _.i !== item.i)
      for (let wIndex = 0; wIndex < item.w; wIndex += 1) {
        for (let hIndex = 0; hIndex < item.h; hIndex += 1) {
          layout = layout.concat({
            x: item.x + wIndex,
            y: item.y + hIndex,
            w: 1,
            h: 1,
            i: item.i + wIndex + 6 * hIndex,
            selected: false,
            component: false,
            included: false,
            merged: false,
          })
        }
      }
      this.$set(this, 'layout', layout)
    },
    reselectSelection(item) {
      this.$set(item, 'component', null)
    },
    resizeEvent(...args) {
      console.log(...args)
    },
    moveEvent(i, newX, newY) {
      if(!this.movingItem) {
        this.movingItem = this.layout.find(_ => _.i === i)
      }
      console.log('move', i, newX, newY)
    },
    resizedEvent(...args) {
      console.log(...args)
    },
    movedEvent(i ,newX, newY) {
      console.log(this.movingItem)
      let newArr = []
      let oldArr = []
      const movingItem = this.layout.find(_ => _.i === i)
      const oldItem = {x: i%6, y: Math.floor(i/6)}
      for(let wIndex = oldItem.x; wIndex < oldItem.x + movingItem.w; wIndex += 1) {
        for (let hIndex = oldItem.y; hIndex < oldItem.y + movingItem.h; hIndex += 1) {
          oldArr = oldArr.concat({i: 6 * hIndex + wIndex, x: wIndex, y: hIndex, w: 1, h: 1, selected: false, included: false, merged: false, isDraggable: false, isResizable: false})
        }
      }
      for(let wIndex = newX; wIndex < newX + movingItem.w; wIndex += 1) {
        for (let hIndex = newY; hIndex < newY + movingItem.h; hIndex += 1) {
          newArr = newArr.concat({i: 6 * hIndex + wIndex, x: wIndex, y: hIndex, w: 1, h: 1})
        }
      }
      const needAddItem = oldArr.concat({...movingItem, x: newX, y: newY, i: 6*newY + newX})
      const needRemoveItem = newArr.concat(movingItem)

      console.table(needAddItem)
      console.table(needRemoveItem)
      this.needAddItem = needAddItem
      this.needRemoveItem = needRemoveItem
      const layout = this.layout
        .filter(item => (!needRemoveItem.find(_ => _.i === item.i)))
        .concat(needAddItem)
        // .concat({...movingItem, x: newX, y: newY, i: 6*newY + newX})
      this.$set(this, 'layout', layout)
    },
    layoutUpdatedEvent(layout) {
      console.table('updated', layout)
    },
  },
}
</script>

<style module>
.option {
  min-width: 30px;
  height: 70px;
  background-color: white;
  border: 2px solid gray;
  float: left;
  margin: 10px;
}

.optionImage {
  width: 30px;
  height: 30px;
  margin: 10px 10px 5px;
}

.optionText {
  color: black;
}

.menu {
  position: absolute;
  right: 5px;
  top: 5px;
}
</style>

<style scoped>
.container {
  width: 330px;
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
