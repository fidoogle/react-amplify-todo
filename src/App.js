/* src/App.js */
import React, { useEffect, useState } from 'react'
import { API, graphqlOperation } from 'aws-amplify'
import { createTodo } from './graphql/mutations'
import { listTodos } from './graphql/queries'
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const initialState = { name: '', description: '', target_date: '', completion_date: '' }

const App = () => {
  const [formState, setFormState] = useState(initialState)
  const [todos, setTodos] = useState([])
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    fetchTodos()
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
  function setInput(key, value) {
    setFormState({ ...formState, [key]: value })
  }
  function setDateValue(key, value) {
    if (key==='target_date') setStartDate(value)
    else setEndDate(value)
    setInput(key, value)
  }

  async function fetchTodos() {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos))
      const todos = todoData.data.listTodos.items
      setTodos(todos)
    } catch (err) { console.log('error fetching todos') }
  }

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

  return (
    <div style={styles.container}>
    <AmplifySignOut />
      <h2>My Todos</h2>

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

      <div style={styles.fieldwithlabel}>
        Completion Date &nbsp;
        <DatePicker selected={endDate} onChange={date => setDateValue('completion_date', date)} placeholderText="Completion Date"/>
      </div>

      <button style={styles.button} onClick={addTodo}>Create Todo</button>
      {
        todos.map((todo, index) => (
          <div key={todo.id ? todo.id : index} style={styles.todo}>
            <p style={styles.todoName}>{todo.name}</p>
            <p style={styles.todoDescription}>{todo.description}</p>
            <p style={styles.todoDescription}>{formatDate(todo.target_date)}</p>
            <p style={styles.todoDescription}>{formatDate(todo.completion_date)}</p>
          </div>
        ))
      }
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