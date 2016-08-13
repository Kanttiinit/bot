const packageInfo = require('../package.json');
const fs = require('fs');

const greeting = `Hello, human being.
I'm KanttiinitBOT and I'm ${packageInfo.version} versions old.

Try typing / to get started
or /help to see what I do.`;

const help = fs.readFileSync(__dirname + '/help.txt');
const commands = fs.readFileSync(__dirname + '/commands.txt');

module.exports = function(bot) {
   function greet(msg) {
   	return bot.sendMessage(msg.chat.id, help);
   }

   function giveHelp(msg) {
   	return bot.sendMessage(msg.chat.id, help);
   }

	 function giveCommands(msg) {
		 return bot.sendMessage(msg.chat.id, commands);
	 }

   bot.onText(/^(hello|hey|hi|moi|mo|hei|sup)$/i, msg => {
   	greet(msg);
   });

   bot.onText(/^(\/)?start/i, msg => {
   	greet(msg);
   });

   bot.onText(/^(\/)?help/i, msg => {
   	giveHelp(msg);
   });

	 bot.onText(/^(\/)?commands/i, msg => {
		 giveCommands(msg);
	 })
};
