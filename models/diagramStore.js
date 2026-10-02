// Хранилище диаграмм в памяти (без базы данных): общий массив для HTML-страниц и REST API.
const seeds = require('../seeds/diagrams');

const SEED = () => seeds.base();

const DIAGRAM_TYPES = ['flowchart', 'sequence', 'class', 'state'];

let diagrams = SEED();
let nextId = 3;

const getAll = () => diagrams;
const getById = (id) => diagrams.find((d) => d.id === id);

const create = ({ title, type, dsl }) => {
  const diagram = {
    id: nextId++,
    title: title.trim(),
    type: type ? type.trim() : 'flowchart',
    dsl: dsl.trim(),
    createdAt: new Date().toISOString()
  };
  diagrams.push(diagram);
  return diagram;
};

const update = (id, { title, type, dsl }) => {
  const index = diagrams.findIndex((d) => d.id === id);
  if (index === -1) return null;
  diagrams[index] = {
    id,
    title: title.trim(),
    type: type ? type.trim() : diagrams[index].type,
    dsl: dsl.trim(),
    createdAt: diagrams[index].createdAt,
    updatedAt: new Date().toISOString()
  };
  return diagrams[index];
};

const remove = (id) => {
  const index = diagrams.findIndex((d) => d.id === id);
  if (index === -1) return false;
  diagrams.splice(index, 1);
  return true;
};

// Возврат к начальным данным (нужен тестам).
const reset = () => {
  diagrams = SEED();
  nextId = 3;
};

module.exports = { DIAGRAM_TYPES, getAll, getById, create, update, remove, reset };
