const express = require('express');
const routes = require('./routes/index');

const app = express();
app.use('/', routes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server is listening at http://localhost:${PORT}`);
});
