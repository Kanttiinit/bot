const express = require('express');
const packageInfo = require('./package.json');
const bodyParser = require('body-parser');
const bot = require('./bot');

const app = express();

const feedbackChat = process.env.CHAT_ID;

app.use(bodyParser.json());

app
.get('/', (req, res) => {
  res.json({version: packageInfo.version});
})
.post('/feedback', (req, res) => {
   bot.sendMessage(feedbackChat, 'NEW FEEDBACK (WEB):\n' + req.body.message);
   res.json({success: true});
})
.post('/' + bot.token, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000);
