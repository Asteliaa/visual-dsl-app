// REST API: JSON-контроллер диаграмм. Данные берутся из общего хранилища.
const store = require('../models/diagramStore');

const parseId = (value) => (/^\d+$/.test(value) ? parseInt(value, 10) : NaN);
const isFilled = (value) => typeof value === 'string' && value.trim() !== '';

exports.getAllDiagrams = (req, res) => {
  const { search } = req.query;
  const diagrams = store.getAll();

  if (search) {
    const q = String(search).toLowerCase();
    const filtered = diagrams.filter(
      (d) => d.title.toLowerCase().includes(q) || d.type.toLowerCase().includes(q)
    );
    return res.status(200).json(filtered);
  }

  res.status(200).json(diagrams);
};

exports.getDiagramById = (req, res) => {
  const id = parseId(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID должен быть числом' });

  const diagram = store.getById(id);
  if (!diagram) return res.status(404).json({ error: 'Диаграмма не найдена' });

  res.status(200).json(diagram);
};

exports.createDiagram = (req, res) => {
  const { title, type, dsl } = req.body || {};

  if (!isFilled(title)) return res.status(400).json({ error: 'Поле "title" обязательно' });
  if (!isFilled(dsl)) return res.status(400).json({ error: 'Поле "dsl" обязательно' });

  res.status(201).json(store.create({ title, type: isFilled(type) ? type : undefined, dsl }));
};

exports.updateDiagram = (req, res) => {
  const id = parseId(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID должен быть числом' });

  if (!store.getById(id)) {
    return res.status(404).json({ error: 'Диаграмма для обновления не найдена' });
  }

  const { title, type, dsl } = req.body || {};
  if (!isFilled(title) || !isFilled(dsl)) {
    return res.status(400).json({ error: 'Для PUT обязательны поля "title" и "dsl"' });
  }

  res.status(200).json(store.update(id, { title, type: isFilled(type) ? type : undefined, dsl }));
};

exports.deleteDiagram = (req, res) => {
  const id = parseId(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID должен быть числом' });

  if (!store.remove(id)) {
    return res.status(404).json({ error: 'Диаграмма не найдена или уже удалена' });
  }

  res.status(204).send();
};
