const express = require("express");
const diagramRoutes = require("./routes/diagramRoutes");
const authRoutes = require("./routes/authRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRoutes);
  app.use("/diagrams", diagramRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
