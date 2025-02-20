import { bus } from "../main.js"

export class ScreenList {
  constructor() {
    this.screens = {}
    this.size = 0
    this.first = null
  }

  [Symbol.iterator]() {
    let currentId = this.first
    let currentScreen = this.get(currentId)
    return {
      next: () => {
        if (currentScreen) {
          let value = currentScreen
          currentId = currentScreen.next
          currentScreen = this.screens[currentId]
          return { value: value, done: false }
        }
        return { done: true }
      },
    }
  }

  static from(screens) {
    let obj = new ScreenList()
    for (let [i, screen] of screens.entries()) {
      obj.screens[screen.screen_id] = {
        screen: screen,
        prev: i > 0 ? screens[i - 1].screen_id : null,
        next: i < screens.length - 1 ? screens[i + 1].screen_id : null,
      }
    }
    if (screens.length > 0) {
      obj.first = screens[0].screen_id
    }
    obj.size = screens.length
    return obj
  }

  getNextByN(screenId, n) {
    let currentScreen = this.get(screenId)
    let nextScreen = currentScreen
    for (let i = 0; i < n; i++) {
      nextScreen = this.get(nextScreen.next)
    }
    return nextScreen
  }

  get(screenId) {
    return this.screens[screenId]
  }

  set(screenId, screen) {
    if (screenId in this.screens) {
      this.screens[screenId] = screen
    }
  }

  // add a new screen after or before the screen with screenId
  add(screenId, newScreen, after = false) {
    let addedScreen = {
      prev: null,
      next: null,
      screen: newScreen,
    }
    let target = this.get(screenId)

    if (target.prev === null && !after) {
      this.first = newScreen.screen_id
    }

    if (after) {
      addedScreen.prev = screenId
      addedScreen.next = target.next
      if (target.next) {
        this.get(target.next).prev = newScreen.screen_id
      }
      target.next = newScreen.screen_id
    } else {
      addedScreen.prev = target.prev
      addedScreen.next = screenId
      if (target.prev) {
        this.get(target.prev).next = newScreen.screen_id
      }
      target.prev = newScreen.screen_id
    }

    this.screens[newScreen.screen_id] = addedScreen
    this.size++
  }

  // add a list of new screens after the screen with screenId
  addNScreens(screenId, newScreens) {
    for (let i = 0; i < newScreens.length; i++) {
      this.add(screenId, newScreens[i], after)
      screenId = newScreens[i].screen_id
    }
    return screenId
  }

  merge(screenId, mergeWithNextSCreen) {
    let target = this.get(screenId)
    let screenToDelete
    if (mergeWithNextSCreen) {
      screenToDelete = this.get(target.next)

      target.screen.text = target.screen.text.concat(screenToDelete.screen.text)
      target.screen.words = target.screen.words.concat(
        screenToDelete.screen.words
      )

      target.screen.etime = screenToDelete.screen.etime
    } else {
      screenToDelete = this.get(target.prev)

      target.screen.text = screenToDelete.screen.text.concat(target.screen.text)
      target.screen.words = screenToDelete.screen.words.concat(
        target.screen.words
      )

      target.screen.stime = screenToDelete.screen.stime
    }

    return this.delete(screenToDelete.screen.screen_id)
  }

  delete(screenId) {
    let target = this.get(screenId)
    let prev = this.get(target.prev)
    let next = this.get(target.next)

    if (target.prev === null) {
      this.first = target.next
    }

    if (prev) {
      // general case
      prev.next = target.next
      if (next) {
        // end of list
        next.prev = target.prev
      }
    } else if (next) {
      // start of list
      next.prev = target.prev
    }
    this.screens[screenId] = null
    this.size--
    bus.$emit("delete_screen", { screenId })
    return screenId
  }

  deleteByN(screenId, n) {
    let target = this.get(screenId)
    for (let i = 0; i < n; i++) {
      this.delete(screenId)
      screenId = target.next
    }
    return screenId
  }

  applyDelta(delta) {
    // delta is an array composed of {retain: n}, {insert: screen}, {delete: n}
    let currentScreenId = this.first
    for (let i = 0; i < delta.length; i++) {
      let op = delta[i]
      if (op.retain) {
        currentScreenId = this.getNextByN(currentScreenId, op.retain).screen
          .screen_id
      } else if (op.insert) {
        this.addNScreens(currentScreenId, op.insert)
      } else if (op.delete) {
        currentScreenId = this.deleteByN(currentScreenId, op.delete)
      }
    }
  }
}
