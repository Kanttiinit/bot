import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as packageInfo from './package.json';
import createBot from './src';

const app = express();

const feedbackChat = process.env.CHAT_ID;

const bot = createBot();

process.on('unhandledRejection', (err) => {
  bot.sendMessage(feedbackChat, `#SRS_ERROR: ${err}`);
});

app.use(bodyParser.json());

app
  .get('/', (req, res) => {
    res.json({ version: packageInfo.version });
  })
  .options('/feedback', cors())
  .post('/feedback', cors(), (req, res) => {
    bot.sendMessage(feedbackChat, `#FEEDBACK_WEB:\n${req.body.message}`);
    res.json({ success: true });
  })
  .post(`/${bot.token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

app.listen(process.env.PORT || 3000);
