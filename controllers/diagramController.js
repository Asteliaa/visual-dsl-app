const store = require("../models/diagramStore");

function validatePayload(body) {
  if (!body || typeof body.title !== "string" || body.title.trim() === "") {
    return "title обязателен и должен быть непустой строкой";
  }
  if (!body || typeof body.notation !== "string" || body.notation.trim() === "") {
    return "notation обязателен и должен быть непустой строкой";
  }
  return null;
}

function getAll(req, res) {
  res.status(200).json(store.findAll());
}

function getById(req, res) {
  const id = Number(req.params.id);
  const diagram = store.findById(id);
  if (!diagram) {
    return res.status(404).json({ error: "Диаграмма не найдена" });
  }
  res.status(200).json(diagram);
}

function create(req, res) {
  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  const diagram = store.create(req.body);
  res.status(201).json(diagram);
}

function update(req, res) {
  const id = Number(req.params.id);
  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  const diagram = store.update(id, req.body);
  if (!diagram) {
    return res.status(404).json({ error: "Диаграмма не найдена" });
  }
  res.status(200).json(diagram);
}

function remove(req, res) {
  const id = Number(req.params.id);
  const removed = store.remove(id);
  if (!removed) {
    return res.status(404).json({ error: "Диаграмма не найдена" });
  }
  res.status(204).send();
}

module.exports = { getAll, getById, create, update, remove, validatePayload };
