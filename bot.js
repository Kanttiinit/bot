const fetch = require('node-fetch');
const request = require('request');
const fs = require('fs');
const TGBot = require('node-telegram-bot-api');

const packageInfo = require('./package.json');
const token = process.env.TG_BOT_TOKEN;

var bot;
if (process.env.NODE_ENV === 'production') {
   bot = new TGBot(token);
   bot.setWebHook('https://bot.kanttiinit.fi/' + token);
} else {
   bot = new TGBot(token, {polling:true});
}

function json(url) {
   return fetch(url).then(r => r.json());
}

function postRestaurantWithID(chatID, restaurantID) {
   request({
      url: 'https://api.kanttiinit.fi/restaurants/' + restaurantID + '/image',
      encoding: null
   }, function(err, response, buffer) {
      bot.sendPhoto(chatID, buffer);
   });
};

function postRestaurantWithName(chatID, restaurantName) {
   json('https://api.kanttiinit.fi/restaurants')
   .then(restaurants => {
      const restaurant = restaurants.find(r => r.name.match(new RegExp('^' + restaurantName, 'i')));

      if (restaurant) {
         postRestaurantWithID(chatID, restaurant.id);
      } else {
         bot.sendMessage(chatID, 'Invalid restaurant :(');
      }
   });
};

bot.onText(/^\/get (.+)$/, (msg, match) => {
   const requested = match[1].toLowerCase();
   const chatID = msg.chat.id;
   if (isNaN(requested)) {
      postRestaurantWithName(chatID, requested);
   } else {
      postRestaurantWithID(chatID, requested);
   }
});

bot.onText(/^\/getRestaurants$/, (msg, match) => {
   const chatID = msg.chat.id;
   json('https://api.kanttiinit.fi/restaurants')
   .then(restaurants => {
      const restaurantString = restaurants
         .sort((a, b) => a.name < b.name ? -1 : 1)
         .map(r => r.name + ': ' + r.id)
         .join('\n');

      bot.sendMessage(chatID, restaurantString);
   });
});

bot.onText(/^\/getSub$/, (msg, match) => {
   const chatID = msg.chat.id;
   json('https://api.kanttiinit.fi/menus/2')
   .then(body => {
      const subway = body[0].Menus[0].courses.find(m => m.title.match(/Subway\:/));
      if (subway) {
         bot.sendMessage(chatID, subway.title);
      } else {
         bot.sendMessage(chatID, 'No Subway today :(');
      }
   });
});

module.exports = bot;
