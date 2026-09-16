let diagrams = [];
let nextId = 1;

function reset() {
  diagrams = [];
  nextId = 1;
}

function findAll() {
  return diagrams;
}

function findById(id) {
  return diagrams.find((diagram) => diagram.id === id);
}

function create({ title, notation, dslContent }) {
  const diagram = {
    id: nextId++,
    title,
    notation,
    dslContent: dslContent || "",
    createdAt: new Date().toISOString(),
  };
  diagrams.push(diagram);
  return diagram;
}

function update(id, { title, notation, dslContent }) {
  const diagram = findById(id);
  if (!diagram) return null;
  diagram.title = title;
  diagram.notation = notation;
  diagram.dslContent = dslContent || "";
  return diagram;
}

function remove(id) {
  const index = diagrams.findIndex((diagram) => diagram.id === id);
  if (index === -1) return false;
  diagrams.splice(index, 1);
  return true;
}

module.exports = { reset, findAll, findById, create, update, remove };
