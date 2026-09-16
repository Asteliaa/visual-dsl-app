const { ValidationError } = require("sequelize");
const Diagram = require("../models/Diagram");

async function getAll(req, res, next) {
  try {
    const diagrams = await Diagram.findAll();
    res.status(200).json(diagrams);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const diagram = await Diagram.findByPk(req.params.id);
    if (!diagram) {
      return res.status(404).json({ error: "Диаграмма не найдена" });
    }
    res.status(200).json(diagram);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const diagram = await Diagram.create(req.body);
    res.status(201).json(diagram);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.errors.map((e) => e.message).join(", ") });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const diagram = await Diagram.findByPk(req.params.id);
    if (!diagram) {
      return res.status(404).json({ error: "Диаграмма не найдена" });
    }
    await diagram.update(req.body);
    res.status(200).json(diagram);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.errors.map((e) => e.message).join(", ") });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deletedCount = await Diagram.destroy({ where: { id: req.params.id } });
    if (deletedCount === 0) {
      return res.status(404).json({ error: "Диаграмма не найдена" });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
