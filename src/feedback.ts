const feedbackChat = Number(process.env.CHAT_ID);

function sendFeedback(bot, msg, feedback) {
  bot.sendMessage(feedbackChat, `#FEEDBACK_BOT ${msg.chat.id}\n${feedback}`)
    .then((x) => {
      bot.sendMessage(msg.chat.id, 'Thanks for the feedback!');
    });
}

export default function (bot) {
  bot.onText(/^\/(feedback)(@KanttiinitBOT) ?(.+)?$/, (msg, match) => {
    if (match[3]) {
      sendFeedback(bot, msg, match[3]);
    } else {
      bot.sendMessage(msg.chat.id, "Please give some feedback like '/feedback thanks for the bot!'");
    }
  });

  // sending feedback
  bot.onText(/^\/feedback (.+)$/, (msg, match) => {
    sendFeedback(bot, msg, match[1]);
  });

  // responding to feedback
  bot.onText(/^\/respond ([^\s]+) (.+)$/, (msg, match) => {
    if (msg.chat.id === feedbackChat) {
      const chatId = match[1];
      const message = match[2];
      bot.sendMessage(chatId, `A response from the developers:\n${message}`)
        .then(() => bot.sendMessage(feedbackChat, 'Response sent.'));
    } else {
      bot.sendMessage(msg.chat.id, 'Unauthorized');
    }
  });
}
