const express = require('express');
const packageInfo = require('./package.json');
const bodyParser = require('body-parser');
const bot = require('./bot');

const app = express();

app.use(bodyParser.json());

app
.get('/', (req, res) => {
  res.json({version: packageInfo.version});
})
.post('/' + bot.token, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000);
