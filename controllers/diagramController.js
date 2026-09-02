let diagrams = [
  {
    id: 1,
    title: 'Архитектура микросервисов',
    type: 'flowchart',
    dsl: 'graph TD; A[Client] --> B[API Gateway]; B --> C[Auth Service];',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Поток авторизации JWT',
    type: 'sequence',
    dsl: 'sequenceDiagram; User->>Server: Login; Server-->>User: Token;',
    createdAt: new Date().toISOString()
  }
];

let nextId = 3;

exports.getAllDiagrams = (req, res) => {
  const { search } = req.query;

  if (search) {
    const filtered = diagrams.filter(d =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase())
    );
    return res.status(200).json(filtered);
  }

  res.status(200).json(diagrams);
};

exports.getDiagramById = (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID должен быть числом' });
  }

  const diagram = diagrams.find(d => d.id === id);

  if (!diagram) {
    return res.status(404).json({ error: 'Диаграмма не найдена' });
  }

  res.status(200).json(diagram);
};

exports.createDiagram = (req, res) => {
  const { title, type, dsl } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Поле "title" обязательно' });
  }

  if (!dsl || typeof dsl !== 'string' || !dsl.trim()) {
    return res.status(400).json({ error: 'Поле "dsl" обязательно' });
  }

  const newDiagram = {
    id: nextId++,
    title: title.trim(),
    type: type ? type.trim() : 'flowchart',
    dsl: dsl.trim(),
    createdAt: new Date().toISOString()
  };

  diagrams.push(newDiagram);
  res.status(201).json(newDiagram);
};

exports.updateDiagram = (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID должен быть числом' });
  }

  const index = diagrams.findIndex(d => d.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Диаграмма для обновления не найдена' });
  }

  const { title, type, dsl } = req.body;

  if (!title || !dsl) {
    return res.status(400).json({ error: 'Для PUT обязательны поля "title" и "dsl"' });
  }

  diagrams[index] = {
    id,
    title: title.trim(),
    type: type ? type.trim() : diagrams[index].type,
    dsl: dsl.trim(),
    createdAt: diagrams[index].createdAt,
    updatedAt: new Date().toISOString()
  };

  res.status(200).json(diagrams[index]);
};

exports.deleteDiagram = (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID должен быть числом' });
  }

  const index = diagrams.findIndex(d => d.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Диаграмма не найдена или уже удалена' });
  }

  diagrams.splice(index, 1);
  res.status(204).send();
};