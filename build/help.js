"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var help = require("./help.json");
var commands = require("./commands.json");
function default_1(bot) {
    function greet(msg) {
        return bot.sendMessage(msg.chat.id, help);
    }
    function giveHelp(msg) {
        return bot.sendMessage(msg.chat.id, commands);
    }
    function giveCommands(msg) {
        return bot.sendMessage(msg.chat.id, commands);
    }
    bot.onText(/^(hello|hey|hi|moi|mo|hei|sup)$/i, function (msg) {
        greet(msg);
    });
    bot.onText(/^(\/)?start/i, function (msg) {
        greet(msg);
    });
    bot.onText(/^(\/)?help/i, function (msg) {
        giveHelp(msg);
    });
    bot.onText(/^(\/)?commands/i, function (msg) {
        giveCommands(msg);
    });
}
exports.default = default_1;
//# sourceMappingURL=help.js.map