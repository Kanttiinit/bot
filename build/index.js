"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TGBot = require("node-telegram-bot-api");
var api_1 = require("./api");
var feedback_1 = require("./feedback");
var help_1 = require("./help");
var token = process.env.TG_BOT_TOKEN;
var feedbackChatId = process.env.CHAT_ID;
var bot;
if (process.env.NODE_ENV === 'production') {
    bot = new TGBot(token);
    bot.setWebHook("https://bot.kanttiinit.fi/" + token);
}
else {
    bot = new TGBot(token, {
        polling: true,
    });
}
feedback_1.default(bot);
help_1.default(bot);
var defaultUseImage = false;
function postRestaurantImage(msg, restaurantID) {
    api_1.default
        .getRestaurantImage(restaurantID)
        .then(function (image) {
        bot.sendPhoto(msg.chat.id, image);
    })
        .catch(function (error) {
        bot.sendMessage(feedbackChatId, error);
    });
}
function postRestaurantText(msg, restaurantID) {
    api_1.default
        .getRestaurantText(restaurantID)
        .then(function (menuText) {
        bot.sendMessage(msg.chat.id, menuText, { parse_mode: 'HTML' });
    })
        .catch(function (error) {
        bot.sendMessage(msg.chat.id, "Could not parse restaurant: " + restaurantID);
    });
}
function postRestaurantWithID(msg, restaurantID, useImage) {
    if (useImage === void 0) { useImage = defaultUseImage; }
    if (useImage) {
        postRestaurantImage(msg, restaurantID);
    }
    else {
        postRestaurantText(msg, restaurantID);
    }
}
function postRestaurantWithName(msg, restaurantName, useImage) {
    if (useImage === void 0) { useImage = defaultUseImage; }
    api_1.default
        .getRestaurantID(restaurantName)
        .then(function (restaurantID) {
        if (useImage) {
            postRestaurantImage(msg, restaurantID);
        }
        else {
            postRestaurantText(msg, restaurantID);
        }
    })
        .catch(function (error) {
        bot.sendMessage(msg.chat.id, 'Invalid restaurant :(');
    });
}
function postRestaurants(msg, restaurants, useImage) {
    if (useImage === void 0) { useImage = defaultUseImage; }
    restaurants.forEach(function (restaurant) {
        if (useImage) {
            postRestaurantImage(msg, restaurant.id);
        }
        else {
            postRestaurantText(msg, restaurant.id);
        }
    });
}
function postClosestRestaurants(msg, n, useImage) {
    if (useImage === void 0) { useImage = defaultUseImage; }
    api_1.default.getClosestRestaurants(msg.location).then(function (restaurants) {
        if (!restaurants.length) {
            bot.sendMessage(msg.chat.id, 'All restaurants are unavailable right now.');
        }
        else {
            var filtered = restaurants;
            if (filtered.length) {
                if (filtered.length > n) {
                    postRestaurants(msg, filtered.splice(0, n), useImage);
                }
                else {
                    postRestaurants(msg, filtered, useImage);
                }
            }
            else {
                bot.sendMessage(msg.chat.id, 'All restaurants are closed right now.');
            }
        }
    });
}
function postAreaRestaurants(msg, areaName, useImage) {
    if (useImage === void 0) { useImage = defaultUseImage; }
    api_1.default.getAreaRestaurants(areaName).then(function (restaurants) {
        postRestaurants(msg, restaurants, useImage);
    });
}
function postSubway(msg) {
    api_1.default
        .getSubway()
        .then(function (subway) {
        bot.sendMessage(msg.chat.id, subway);
    })
        .catch(function (error) {
        bot.sendMessage(msg.chat.id, 'No subway today :(');
    });
}
function postRestaurantSummary(msg) {
    api_1.default.getRestaurantsFormatted().then(function (restaurantString) {
        bot.sendMessage(msg.chat.id, restaurantString, { parse_mode: 'HTML' });
    });
}
function postVoiceCommand(msg) {
    console.log('Received voice command:');
    console.log(msg);
    bot
        .getFileLink(msg.voice.file_id)
        .then(function (fileLink) {
        console.log(fileLink);
        api_1.default
            .interpretVoice(fileLink)
            .then(function (rsp) {
            console.log('Processed audio');
        })
            .catch(function (error) {
            console.log("Error" + error);
            bot.sendMessage(msg.chat.id, "Couldn't understand you.");
        });
    })
        .catch(function (error) {
        console.log("Error" + error);
        bot.sendMessage(msg.chat.id, "Couldn't download audio file.");
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
function toTgFormat(string) {
    return string
        .replace(/ä/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/_/g, ' ');
}
bot.on('message', function (msg) {
    var chatId = msg.chat.id;
    console.log('bot got message: ', msg);
    bot.sendMessage(chatId, 'Received your message');
});
bot.onText(/(?!\/).+?(?=@|$)/, function (msg, _a) {
    var restaurantName = _a[0];
    if (msg.chat.type === 'private') {
        api_1.default.getRestaurants().then(function (restaurants) {
            var restaurant = restaurants.find(function (r) { return toTgFormat(r.name).match(new RegExp(toTgFormat(restaurantName), 'i')); });
            if (restaurant)
                postRestaurantWithID(msg, restaurant.id);
        });
    }
});
bot.onText(/^\/((?:.*)niemi|töölö|h(?:elsin)?ki|keskusta|stadi)/i, function (msg, match) {
    var areas = [
        {
            pattern: /h(elsin)?ki|keskusta|stadi/i,
            name: 'helsingin keskusta',
            suggestion: 'hki',
        },
        { pattern: /töölö/i, name: 'töölö', suggestion: 'töölö' },
        { pattern: /(.*)niemi/i, name: 'otaniemi', suggestion: 'niemi' },
    ];
    var area = areas.find(function (a) { return match[1].match(a.pattern); });
    if (msg.chat.type === 'private') {
        postAreaRestaurants(msg, area.name);
    }
    else {
        bot.sendMessage(msg.chat.id, "I don't want to spam group chats. Try /" + area.suggestion + " in private!");
    }
});
bot.onText(/^\/food/, function (msg) {
    if (msg.chat.type === 'private') {
        requestLocation(msg);
    }
    else {
        bot.sendMessage(msg.chat.id, 'The /food command only works in private chats :(');
    }
});
bot.onText(/No, don't use my location./, function (msg) {
    bot.sendMessage(msg.chat.id, 'Feel free to use the /menu command, then :)');
});
bot.onText(/^\/(menu|img|txt)(@Kanttiini(.+))?$/, function (msg, match) {
    bot.sendMessage(msg.chat.id, "Give me a restaurant name or ID, please.\n(For example: " + match[0] + " 3)\n\nYou can get them with /restaurants");
});
bot.onText(/^\/(menu|im(?:a)?g(?:e)?) (.+)$/, function (msg, match) {
    var requested = match[2].toLowerCase();
    var chatID = msg.chat.id;
    if (isNaN(requested)) {
        postRestaurantWithName(msg, requested, true);
    }
    else {
        postRestaurantWithID(msg, requested, true);
    }
});
bot.onText(/^\/t(?:e)?xt (.+)$/, function (msg, match) {
    var requested = match[1].toLowerCase();
    if (isNaN(requested)) {
        api_1.default.getRestaurantID(requested).then(function (restaurantID) {
            postRestaurantText(msg, restaurantID);
        });
    }
    else {
        postRestaurantText(msg, requested);
    }
});
bot.onText(/^\/sub/, function (msg) {
    postSubway(msg);
});
bot.onText(/^\/restaurants/, function (msg) {
    postRestaurantSummary(msg);
});
bot.on('location', function (msg) {
    postClosestRestaurants(msg, 3);
});
bot.on('voice', function (msg) {
    postVoiceCommand(msg);
});
//# sourceMappingURL=index.js.map