import { createStore } from '@mpxjs/core'

const store = createStore({
  state: {
    todos: [
      {
        text: '123',
        done: false
      }, {
        text: '123123',
        done: false
      }
    ]
  },
  mutations: {
    addTodo (state, { text }) {
      state.todos.push({
        text,
        done: false
      })
    },
    deleteTodo (state, { index }) {
      state.todos.splice(index, 1)
    },
    toggleTodo (state, { index }) {
      state.todos[index].done = !state.todos[index].done
    },
    editTodo (state, { index, value }) {
      state.todos[index].text = value
    },
    toggleAll (state, { done }) {
      state.todos.forEach((todo) => {
        todo.done = done
      })
    },
    clearCompleted (state) {
      state.todos = state.todos.filter(todo => !todo.done)
    }
  }
})

export default store
