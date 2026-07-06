// index.js
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(bodyParser.json());

let tasks = [
  {
    id: uuidv4(),
    title: 'Initial Task',
    description: 'This is a sample task',
    dueDate: '2025-06-01',
    status: 'active',
    priority: 3,
    assignedUser: 'alice'
  },
  {
    id: uuidv4(),
    title: 'Second Task',
    description: 'Another example task',
    dueDate: '2025-06-15',
    status: 'completed',
    priority: 5,
    assignedUser: 'bob'
  },
  {
    id: "c3e59224-93d5-4b07-9317-6dc24eb586b3",
    title: 'Third Task',
    description: 'Another example task',
    dueDate: '2025-06-15',
    status: 'completed',
    priority: 5,
    assignedUser: 'bob'
  }
];

function generateTaskLinks(task) {
  return {
    self: { href: `/tasks/${task.id}`, method: 'GET' },
    edit: { href: `/tasks/${task.id}/edit`, method: 'POST', args: ['id', 'title', 'description', 'dueDate', 'status', 'priority', 'assignedUser'] },
    updateStatus: { href: `/tasks/${task.id}/status`, method: 'PUT', args: ['id', 'status'] },
    assignUser: { href: `/tasks/${task.id}/assignee`, method: 'PUT', args: ['id', 'assignedUser'] },
    setDueDate: { href: `/tasks/${task.id}/due-date`, method: 'PUT', args: ['id', 'dueDate'] },
    goHome: { href: '/', method: 'GET' },
    goTaskList: { href: '/tasks', method: 'GET' },
    goFilteredTasks: { href: '/tasks?status=&priority=&assignedUser=', method: 'GET', args: ['title', 'dueDate', 'status', 'priority', 'assignedUser'] }
  };
}

app.get('/', (req, res) => {
  res.json({
    _links: {
      taskList: { href: '/tasks', method: 'GET' },
      createTask: { href: '/tasks', method: 'POST', args: ['id', 'title', 'description', 'dueDate', 'status', 'priority', 'assignedUser'] }
    }
  });
});

app.get('/tasks', (req, res) => {
  let filteredTasks = tasks.filter(task => {
    return Object.entries(req.query).every(([key, value]) =>
      task[key] && task[key].toString().toLowerCase().includes(value.toLowerCase())
    );
  });

  res.json(filteredTasks.map(task => ({ ...task, _links: generateTaskLinks(task) })));
});

app.get('/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ ...task, _links: generateTaskLinks(task) });
});

app.post('/tasks', (req, res) => {
  const { task } = req.body;
  const required = ['id', 'title', 'status'];
    
  for (const field of required) {
    if (!task[field]) return res.status(400).json({ error: `Missing required field: ${field}` });
  }
  tasks.push(task);
  res.status(201).json({ ...task, _links: generateTaskLinks(task) });
});

app.post('/tasks/:id/edit', (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });
  tasks[taskIndex] = { ...tasks[taskIndex], ...req.body.task };
  res.json({ ...tasks[taskIndex], _links: generateTaskLinks(tasks[taskIndex]) });
});

app.put('/tasks/:id/status', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!req.body.task || !req.body.task.status) return res.status(400).json({ error: 'Missing required field: status' });
  task.status = req.body.task.status;
  res.json({ ...task, _links: generateTaskLinks(task) });
});

app.put('/tasks/:id/assignee', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!req.body.task || !req.body.task.assignedUser) return res.status(400).json({ error: 'Missing required field: assignedUser' });
  task.assignedUser = req.body.task.assignedUser;
  res.json({ ...task, _links: generateTaskLinks(task) });
});

app.put('/tasks/:id/due-date', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!req.body.task || !req.body.task.dueDate) return res.status(400).json({ error: 'Missing required field: dueDate' });
  task.dueDate = req.body.task.dueDate;
  res.json({ ...task, _links: generateTaskLinks(task) });
});

app.listen(port, () => {
  console.log(`Task Management API running at http://localhost:${port}`);
});

