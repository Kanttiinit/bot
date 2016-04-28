const packageInfo = require('../package.json');
const fs = require('fs');

const greeting = "Hello, human being.\nI'm KanttiinitBOT and I'm " + packageInfo.version + ' versions old.';
const help = fs.readFileSync(__dirname + '/start.txt');

module.exports = function(bot) {
   function greet(msg) {
   	return bot.sendMessage(msg.chat.id, greeting);
   }

   function giveHelp(msg) {
   	return bot.sendMessage(msg.chat.id, help);
   }

   bot.onText(/^(hello|hey|hi|moi|mo|hei|sup)$/i, msg => {
   	greet(msg);
   });

   bot.onText(/^\/start/, msg => {
      console.log(msg.chat.id);
   	greet(msg).then(_ => giveHelp(msg));
   });

   bot.onText(/^\/help/, msg => {
   	giveHelp(msg);
   });
};
