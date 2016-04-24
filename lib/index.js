const express = require('express');
const packageInfo = require('../package.json');
const app = express();

console.log("Starting web server..")

app.get('/', (req, res) => {
  res.json({version: packageInfo.version});
});

const server = app.listen(process.env.PORT || 3000, function() {
  console.log('Web server at http:://%s:%s', server.address().address, server.address().port);
});

module.exports = function (bot) {
  app.post('/' + bot.token, function (req, res) {
    console.log("New POST request: ", req.body);
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
};
