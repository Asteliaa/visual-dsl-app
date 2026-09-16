const createApp = require("./app");
const sequelize = require("./models/db");

const port = process.env.PORT || 3000;
const app = createApp();

sequelize.authenticate().then(() => {
  app.listen(port, () => console.log(`Server running on port ${port}`));
});
