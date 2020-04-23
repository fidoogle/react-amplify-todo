/* src/App.js */
import React, { useEffect, useState } from 'react'
import { API, graphqlOperation } from 'aws-amplify'
import { createTodo, updateTodo } from './graphql/mutations'
import { listTodos } from './graphql/queries'
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const initialState = { name: '', description: '', target_date: '', completion_date: '' }

const App = () => {
  const [formState, setFormState] = useState(initialState)
  const [todos, setTodos] = useState([])
  const [todosDone, setTodosDone] = useState([])
  const [startDate, setStartDate] = useState(new Date());

  useEffect(() => {
    fetchTodos()
    //TODO: create an @aws_subscribe subscription and subscribe to it here for realtime updates
  }, [])

  function formatDate(value) {
    let todate = value
    try {
      todate = new Date(value)
      todate = todate.toLocaleDateString("en-US")
    }
    catch(e) {}
    return todate
  }
  function handleCompleted(event, todo) {
    const completion_date = (event.target.checked)? new Date() : ' '
    updateThisTodo({...todo, completed: event.target.checked, completion_date})
  }
  function setInput(key, value) {
    setFormState({ ...formState, [key]: value })
  }
  function setDateValue(key, value) {
    if (!value) value = new Date()
    setStartDate(value)
    setInput(key, value)
  }

  async function fetchTodos() {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos))
      const todos = todoData.data.listTodos.items
      setTodos(todos.filter(todo => !todo.completed))
      setTodosDone(todos.filter(todo => todo.completed))
    } catch (err) { console.log('error fetching todos') }
  }

  //TODO: add @auth to model to save by owner. Info: https://aws-amplify.github.io/docs/cli-toolchain/graphql#auth
  //TODO: fix saving unchanged default dates
  async function addTodo() { 
    try {
      if (!formState.name || !formState.description) return
      const todo = { ...formState }
      setTodos([...todos, todo])
      setFormState(initialState)
      await API.graphql(graphqlOperation(createTodo, {input: todo}))
    } catch (err) {
      console.log('error creating todo:', err)
    }
  }

  async function updateThisTodo(todo) { 
    try {
      await API.graphql(graphqlOperation(updateTodo, {input: todo}))
      fetchTodos() //TODO: refresh clientside to prevent a round-trip
    } catch (err) {
      console.log('error updating todo:', err)
    }
  }

  return (
    <div style={styles.container}>
    <AmplifySignOut />
      <h2>My Todos - Auto Deploy?</h2>

      <input
        onChange={event => setInput('name', event.target.value)}
        style={styles.input}
        value={formState.name} 
        placeholder="Name"
      />

      <input
        onChange={event => setInput('description', event.target.value)}
        style={styles.input}
        value={formState.description}
        placeholder="Description"
      />

      <div style={styles.fieldwithlabel}>
        Target Date &nbsp;
        <DatePicker selected={startDate} onChange={date => setDateValue('target_date', date)} placeholderText="Target Date"/>
      </div>

      <button style={styles.button} onClick={addTodo}>Create Todo</button>

      <h2>Current Todos</h2>
      <table>
        <thead>
          <tr><th>Done</th>
          <th>Name</th>
          <th>Description</th>
          <th>Target</th>
          </tr>
        </thead>
        <tbody>
        {
          todos.map((todo, index) => (
            <tr key={todo.id ? todo.id : index} style={styles.todo}>
              <td><input
                type="checkbox"
                checked={!!todo.completed}
                onChange={event => handleCompleted(event, todo)} /></td>

              <td>{todo.name}</td>
              <td>{todo.description}</td>
              <td>{formatDate(todo.target_date)}</td>
            </tr>
          ))
        }
        </tbody>
      </table>

      <h2>Completed Todos</h2>
      <table>
        <thead>
          <tr><th>Done</th>
          <th>Name</th>
          <th>Description</th>
          <th>Target</th>
          </tr>
        </thead>
        <tbody>
        {
          todosDone.map((todo, index) => (
            <tr key={todo.id ? todo.id : index} style={styles.todo}>
              <td><input
                type="checkbox"
                checked={!!todo.completed}
                onChange={event => handleCompleted(event, todo)} /></td>

              <td>{todo.name}</td>
              <td>{todo.description}</td>
              <td>{formatDate(todo.target_date)}</td>
            </tr>
          ))
        }
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  container: { width: 400, margin: '0 auto', display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', padding: 20 },
  todo: {  marginBottom: 15 },
  input: { border: 'none', backgroundColor: '#ddd', marginBottom: 10, padding: 8, fontSize: 18 },
  fieldwithlabel: { border: 'none', backgroundColor: '#ddd', color: '#757575', marginBottom: 10, padding: 8, fontSize: 18 },
  todoName: { fontSize: '20px', fontWeight: 'bold' },
  todoDescription: { marginBottom: 0 },
  button: { backgroundColor: 'black', color: 'white', outline: 'none', fontSize: 18, padding: '12px 0px' }
}

export default withAuthenticator(App)