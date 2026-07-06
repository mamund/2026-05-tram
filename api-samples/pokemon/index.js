const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Super basic API for Reading/Creating/Deleting Pokemon and their element-types

const validTypes = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic',
  'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

let pokemon = [
  { id: '001', name: 'Bulbasaur', type: ['Grass', 'Poison'], hp: 45 },
  { id: '004', name: 'Charmander', type: ['Fire'], hp: 39 },
  { id: '007', name: 'Squirtle', type: ['Water'], hp: 44 },
  { id: '025', name: 'Pikachu', type: ['Electric'], hp: 35 },
  { id: '026', name: 'Raichu', type: ['Electric'], hp: 60 },
  { id: '081', name: 'Magnemite', type: ['Electric', 'Steel'], hp: 25 },
  { id: '100', name: 'Voltorb', type: ['Electric'], hp: 40 },
  { id: '101', name: 'Electrode', type: ['Electric'], hp: 60 },
  { id: '019', name: 'Rattata', type: ['Normal'], hp: 30 },
  { id: '020', name: 'Raticate', type: ['Normal'], hp: 55 },
  { id: '052', name: 'Meowth', type: ['Normal'], hp: 40 },
  { id: '113', name: 'Chansey', type: ['Normal'], hp: 250 },
  { id: '143', name: 'Snorlax', type: ['Normal'], hp: 160 }
];

// Returns the API root with hypermedia links to available actions
app.get('/', (req, res) => {
  res.json({
    _links: {
      list: { href: '/pokemon', method: 'GET' },
      types: { href: '/types', method: 'GET' },
      create: { href: '/pokemon', method: 'POST', args: ['id', 'name', 'type', 'hp'] }
    }
  });
});

// Returns the list of all valid pokemon types
app.get('/types', (req, res) => {
  res.json(validTypes);
});

// Lists all pokemon, optionally filtered by type, name, hp_gte, hp_lte
app.get('/pokemon', (req, res) => {
  let results = pokemon;

  if (req.query.type) {
    if (!validTypes.includes(req.query.type)) {
      return res.status(400).json({ error: `Invalid type: ${req.query.type}` });
    }
    results = results.filter(p => p.type.includes(req.query.type));
  }

  if (req.query.name) {
    const search = req.query.name.toLowerCase();
    results = results.filter(p => p.name.toLowerCase().includes(search));
  }

  if (req.query.hp_gte) {
    const min = parseInt(req.query.hp_gte);
    if (isNaN(min)) {
      return res.status(400).json({ error: `hp_gte must be a number` });
    }
    results = results.filter(p => p.hp >= min);
  }

  if (req.query.hp_lte) {
    const max = parseInt(req.query.hp_lte);
    if (isNaN(max)) {
      return res.status(400).json({ error: `hp_lte must be a number` });
    }
    results = results.filter(p => p.hp <= max);
  }

  res.json(results);
});

// Retrieves a single pokemon by its pokedex id (e.g. /pokemon/025 for Pikachu)
app.get('/pokemon/:id', (req, res) => {
  const p = pokemon.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Pokemon not found' });
  res.json(p);
});

// Creates a new pokemon entry; requires id and name, type and hp are optional
app.post('/pokemon', (req, res) => {
  const { id, name, type, hp } = req.body;

  if (!id || !name) {
    return res.status(400).json({ error: 'Missing required fields: id, name' });
  }

  if (type) {
    const invalidTypes = type.filter(t => !validTypes.includes(t));
    if (invalidTypes.length > 0) {
      return res.status(400).json({ error: `Invalid type(s): ${invalidTypes.join(', ')}`});
    }
  }

  // apparently 409 is the 'proper' response when trying to create a resource that already exists? https://stackoverflow.com/a/3826024
  const existing = pokemon.find(p => p.id === id);
  if (existing) {
    return res.status(409).json({ error: `Pokemon with id ${id} already exists` });
  }

  const p = {
    id,
    name,
    type: type || [],
    hp: hp || 0
  };

  pokemon.push(p);
  res.status(201).json(p);
});

// Deletes a pokemon by its pokedex id
app.delete('/pokemon/:id', (req, res) => {
  const index = pokemon.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Pokemon not found' });
  }
  const removed = pokemon.splice(index, 1)[0];
  res.json(removed);
});

app.listen(port, () => {
  console.log(`Pokemon API running at http://localhost:${port}`);
});
