const feedbackChat = Number(process.env.CHAT_ID);

module.exports = function(bot) {
    bot.onText(/^\/feedback(@Kanttiini(.+))?$/, (msg, match) => {
        bot.sendMessage(msg.chat.id, "Please give some feedback like '/feedback thanks for the bot!'");
    });

    // sending feedback
    bot.onText(/^\/feedback (.+)$/, (msg, match) => {
        bot.sendMessage(feedbackChat, '#FEEDBACK_BOT\nFeedback from: ' + msg.chat.id + '\n' + match[1])
            .then(x => {
                bot.sendMessage(msg.chat.id, 'Thanks for the feedback!');
            });
    });

    // responding to feedback
    bot.onText(/^\/respond ([^\s]+) (.+)$/, (msg, match) => {
        if (msg.chat.id === feedbackChat) {
            const chatId = match[1];
            const message = match[2];
            bot.sendMessage(chatId, 'A response from the developers:\n' + message)
                .then(_ => bot.sendMessage(feedbackChat, 'Response sent.'));
        } else {
            bot.sendMessage(msg.chat.id, 'Unauthorized');
        }
    });
};
