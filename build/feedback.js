"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var feedbackChat = Number(process.env.CHAT_ID);
function sendFeedback(bot, msg, feedback) {
    bot.sendMessage(feedbackChat, "#FEEDBACK_BOT " + msg.chat.id + "\n" + feedback)
        .then(function (x) {
        bot.sendMessage(msg.chat.id, 'Thanks for the feedback!');
    });
}
function default_1(bot) {
    bot.onText(/^\/(feedback)(@KanttiinitBOT) ?(.+)?$/, function (msg, match) {
        if (match[3]) {
            sendFeedback(bot, msg, match[3]);
        }
        else {
            bot.sendMessage(msg.chat.id, "Please give some feedback like '/feedback thanks for the bot!'");
        }
    });
    bot.onText(/^\/feedback (.+)$/, function (msg, match) {
        sendFeedback(bot, msg, match[1]);
    });
    bot.onText(/^\/respond ([^\s]+) (.+)$/, function (msg, match) {
        if (msg.chat.id === feedbackChat) {
            var chatId = match[1];
            var message = match[2];
            bot.sendMessage(chatId, "A response from the developers:\n" + message)
                .then(function () { return bot.sendMessage(feedbackChat, 'Response sent.'); });
        }
        else {
            bot.sendMessage(msg.chat.id, 'Unauthorized');
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=feedback.js.map