import * as TGBot from 'node-telegram-bot-api';
import api from './api';
// import filters from './filters';

import feedback from './feedback';
import help from './help';

const token = process.env.TG_BOT_TOKEN;

function root(bot) {
  function postRestaurantText(msg, restaurantID) {
    api
      .getRestaurantText(restaurantID)
      .then((menuText) => {
        bot.sendMessage(msg.chat.id, menuText, { parse_mode: 'HTML' });
      })
      .catch((error) => {
        bot.sendMessage(
          msg.chat.id,
          `Could not parse restaurant: ${restaurantID}`,
        );
      });
  }

  function postRestaurantWithID(msg, restaurantID) {
    postRestaurantText(msg, restaurantID);
  }

  function postRestaurantWithName(
    msg,
    restaurantName,
  ) {
    api
      .getRestaurantID(restaurantName)
      .then((restaurantID) => {
        postRestaurantText(msg, restaurantID);
      })
      .catch((error) => {
        bot.sendMessage(msg.chat.id, 'Invalid restaurant :(');
      });
  }

  function postRestaurants(msg, restaurants) {
    restaurants.forEach((restaurant) => {
      postRestaurantText(msg, restaurant.id);
    });
  }

  function postClosestRestaurants(msg, n) {
    api.getClosestRestaurants(msg.location).then((restaurants) => {
      if (!restaurants.length) {
        bot.sendMessage(
          msg.chat.id,
          'All restaurants are unavailable right now.',
        );
      } else {
        const filtered = restaurants;
        if (filtered.length) {
          if (filtered.length > n) {
            postRestaurants(msg, filtered.splice(0, n));
          } else {
            postRestaurants(msg, filtered);
          }
        } else {
          bot.sendMessage(msg.chat.id, 'All restaurants are closed right now.');
        }
      }
    });
  }

  function postAreaRestaurants(msg, areaName) {
    api.getAreaRestaurants(areaName).then((restaurants) => {
      postRestaurants(msg, restaurants);
    });
  }

  function postSubway(msg) {
    api
      .getSubway()
      .then((subway) => {
        bot.sendMessage(msg.chat.id, subway);
      })
      .catch((error) => {
        bot.sendMessage(msg.chat.id, 'No subway today :(');
      });
  }

  function postRestaurantSummary(msg) {
    api.getRestaurantsFormatted().then((restaurantString) => {
      bot.sendMessage(msg.chat.id, restaurantString, { parse_mode: 'HTML' });
    });
  }

  function requestLocation(msg) {
    bot.sendMessage(msg.chat.id, 'Can I use your location?', {
      reply_markup: {
        keyboard: [
          [
            {
              text: 'Sure, use my location!',
              request_location: true,
            },
          ],
          [
            {
              text: "No, don't use my location.",
              hide_keyboard: true,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
        selective: true,
      },
    });
  }

  // Thanks telegram API
  function toTgFormat(string) {
    return string
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/_/g, ' ');
  }

  // Fuzzy finding for autofilled commands
  bot.onText(/(?!\/).+?(?=@|$)/, (msg, [restaurantName]) => {
    if (msg.chat.type === 'private') {
      api.getRestaurants().then((restaurants) => {
        const restaurant = restaurants.find(r => toTgFormat(r.name).match(new RegExp(toTgFormat(restaurantName), 'i')));
        if (restaurant) postRestaurantWithID(msg, restaurant.id);
      });
    }
  });

  bot.onText(
    /^\/((?:.*)niemi|töölö|h(?:elsin)?ki|keskusta|stadi)/i,
    (msg, match) => {
      const areas = [
        {
          pattern: /h(elsin)?ki|keskusta|stadi/i,
          name: 'helsingin keskusta',
          suggestion: 'hki',
        },
        { pattern: /töölö/i, name: 'töölö', suggestion: 'töölö' },
        { pattern: /(.*)niemi/i, name: 'otaniemi', suggestion: 'niemi' },
      ];

      const area = areas.find(a => match[1].match(a.pattern));

      if (msg.chat.type === 'private') {
        postAreaRestaurants(msg, area.name);
      } else {
        bot.sendMessage(
          msg.chat.id,
          `I don't want to spam group chats. Try /${area.suggestion} in private!`,
        );
      }
    },
  );

  bot.onText(/^\/food/, (msg) => {
    if (msg.chat.type === 'private') {
      requestLocation(msg);
    } else {
      bot.sendMessage(
        msg.chat.id,
        'The /food command only works in private chats :(',
      );
    }
  });

  bot.onText(/No, don't use my location./, (msg) => {
    bot.sendMessage(msg.chat.id, 'Feel free to use the /menu command, then :)');
  });

  bot.onText(/^\/(menu|img|txt)(@Kanttiini(.+))?$/, (msg, match) => {
    bot.sendMessage(
      msg.chat.id,
      `Give me a restaurant name or ID, please.\n(For example: ${
        match[0]
      } 3)\n\nYou can get them with /restaurants`,
    );
  });

  bot.onText(/^\/(menu|im(?:a)?g(?:e)?) (.+)$/, (msg, match) => {
    const requested = match[2].toLowerCase();
    if (isNaN(requested)) {
      postRestaurantWithName(msg, requested);
    } else {
      postRestaurantWithID(msg, requested);
    }
  });

  bot.onText(/^\/t(?:e)?xt (.+)$/, (msg, match) => {
    const requested = match[1].toLowerCase();
    if (isNaN(requested)) {
      api.getRestaurantID(requested).then((restaurantID) => {
        postRestaurantText(msg, restaurantID);
      });
    } else {
      postRestaurantText(msg, requested);
    }
  });

  bot.onText(/^\/sub/, (msg) => {
    postSubway(msg);
  });

  bot.onText(/^\/restaurants/, (msg) => {
    postRestaurantSummary(msg);
  });

  bot.on('location', (msg) => {
    postClosestRestaurants(msg, 3);
  });
}

function createBot() {
  let bot;
  if (process.env.NODE_ENV === 'production') {
    bot = new TGBot(token);
    bot.setWebHook(`https://bot.kanttiinit.fi/${token}`);
  } else {
    bot = new TGBot(token, {
      polling: true,
    });
  }
  feedback(bot);
  help(bot);
  root(bot);
  return bot;
}

export default createBot;
