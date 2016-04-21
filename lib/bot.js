const request = require('request');
const fs = require('fs');
const packageInfo = require('../package.json');
const token = process.env.TG_BOT_TOKEN;
const TGBot = require('node-telegram-bot-api');
var bot;

console.log("Starting bot server...")

if(process.env.NODE_ENV === 'production') {
  console.log("Production");
  bot = new TGBot(token);
  bot.setWebHook('https://bot.kanttiinit.fi/' + token);
} else {
  console.log("Local");
  bot = new TGBot(token, {polling:true});
}

const forwardImage = (chatID, uri, fileName) => {
  request.head(uri, function(err, res, body) {
    request(uri).pipe(fs.createWriteStream(fileName)).on('close', () => {
      bot.sendPhoto(chatID, fileName);
    });
  });
};

const postRestaurantWithID = (chatID, restaurantID) => {
  const imgUrl = 'https://api.kanttiinit.fi/restaurants/' + restaurantID + '/image?day=2016-04-18';
  //TODO: figure out to how to do this by generating an image only once on the backend
  const fileName = restaurantID + '.png';
  forwardImage(chatID, imgUrl, fileName);
};

const postRestaurantWithName = (chatID, restaurantName) => {
  request({
    url: 'https://api.kanttiinit.fi/restaurants',
    json: true
  }, (error, response, body) => {
    if(!error && response.statusCode === 200) {
      var resultFound = false;
      for(var restaurant in body) {
        const currentRestaurant = body[restaurant];
        if(currentRestaurant.name.toLowerCase() === restaurantName) {
          postRestaurantWithID(chatID, currentRestaurant.id);
          resultFound = true;
          break;
        }
      }
      if(!resultFound) {
        bot.sendMessage(chatID, "Invalid restaurant :(");
      }
    }
  });
};

bot.onText(/^\/get (.+)$/, (msg, match) => {
  const requested = match[1].toLowerCase();
  const chatID = msg.chat.id;
  if(isNaN(requested)) {
    const restaurantID = postRestaurantWithName(chatID, requested);
  } else {
    postRestaurantWithID(msg.chat.id, requested);
  }
});

bot.onText(/^\/getRestaurants$/, (msg, match) => {
  const chatID = msg.chat.id;
  const restaurantData = [];
  request({
    url: 'https://api.kanttiinit.fi/restaurants',
    json: true
  }, (error, response, body) => {
    if(!error && response.statusCode === 200) {
      for(var restaurant in body) {
        const currentRestaurant = body[restaurant];
        restaurantData.push(currentRestaurant.name + ": " + currentRestaurant.id);
      }
    }
    bot.sendMessage(chatID, restaurantData.join("\n"));
  });
});

bot.onText(/^\/getSub$/, (msg, match) => {
  const chatID = msg.chat.id;
  request({
    url: 'https://api.kanttiinit.fi/menus/2',
    json: true
  }, (error, response, body) => {
    if(!error && response.statusCode === 200) {
      const currentMenu = body[0].Menus[0].courses;
      for(var item in currentMenu) {
        const currentItem = currentMenu[item];
        if(currentItem.title != null) {
          const currentItems = currentItem.title.split(" ");
          if(currentItems[0] == "Subway:") {
            bot.sendMessage(chatID, currentItem.title);
            break;
          }
        }
      }
    }
  });
});

console.log("Bot server started");

module.exports = bot;
