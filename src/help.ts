import * as help from './help.json';

import * as commands from './commands.json';

export default function (bot) {
  function greet(msg) {
    return bot.sendMessage(msg.chat.id, help);
  }

  function giveHelp(msg) {
    return bot.sendMessage(msg.chat.id, commands);
  }

  function giveCommands(msg) {
    return bot.sendMessage(msg.chat.id, commands);
  }

  bot.onText(/^(hello|hey|hi|moi|mo|hei|sup)$/i, (msg) => {
    greet(msg);
  });

  bot.onText(/^(\/)?start/i, (msg) => {
    greet(msg);
  });

  bot.onText(/^(\/)?help/i, (msg) => {
    giveHelp(msg);
  });

  bot.onText(/^(\/)?commands/i, (msg) => {
    giveCommands(msg);
  });
}
