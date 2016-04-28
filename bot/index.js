const fetch = require('node-fetch');
const request = require('request');
const TGBot = require('node-telegram-bot-api');

const token = process.env.TG_BOT_TOKEN;

var bot;
if (process.env.NODE_ENV === 'production') {
	bot = new TGBot(token);
	bot.setWebHook('https://bot.kanttiinit.fi/' + token);
} else {
	bot = new TGBot(token, {
		polling: true
	});
}

require('./feedback')(bot);
require('./help')(bot);

function json(url) {
	return fetch(url).then(r => r.json());
}

function postRestaurantWithID(chatID, restaurantID) {
	request({
		url: 'https://api.kanttiinit.fi/restaurants/' + restaurantID + '/image',
		encoding: null
	}, function(err, response, buffer) {
		if (response.statusCode === 200) {
			bot.sendPhoto(chatID, buffer);
		} else {
			bot.sendMessage(chatID, 'Error with restaurant: ' + restaurantID + ' :(');
			bot.sendMessage(feedbackChat,
				'(BOT) Error ' + response.statusCode + ': postRestaurantWithID with restaurantID ' + restaurantID);
		}
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

function postClosestRestaurants(msg, n) {
	const loc = msg.location;
	json('https://api.kanttiinit.fi/restaurants?location=' + loc.latitude + ',' + loc.longitude)
	.then( restaurants => {
		for(var i = 0; i < n; i++) {
			postRestaurantWithID(msg.chat.id, restaurants[i].id);
		}
	});
};

bot.onText(/^\/food/, (msg, match) => {
	if(msg.chat.type === 'private') {
		bot.sendMessage(msg.chat.id, 'Can I use your location?', {
			'reply_markup':{
				'keyboard':[[{
					'text':'Sure, use my location!',
					'request_location':true
				}], [{
					'text':"No, don't use my location.",
					'hide_keyboard':true
				}]],
				'resize_keyboard':true,
				'one_time_keyboard':true,
				'selective':true
			}
		});
	} else {
		bot.sendMessage(msg.chat.id, 'The /food command only works in private chats :(');
	}
});

bot.onText(/No, don't use my location./, (msg, match) => {
	bot.sendMessage(msg.chat.id, "Feel free to use the /menu command, then :)");
})

bot.onText(/^\/menu(@Kanttiini(.+))?$/, (msg, match) => {
	bot.sendMessage(msg.chat.id, 'Give me a restaurant name or ID, please. \nYou can get them with /restaurants ');
});

bot.onText(/^\/menu (.+)$/, (msg, match) => {
	const requested = match[1].toLowerCase();
	const chatID = msg.chat.id;
	if (isNaN(requested)) {
		postRestaurantWithName(chatID, requested);
	} else {
		postRestaurantWithID(chatID, requested);
	}
});

bot.onText(/^\/sub/, (msg, match) => {
	const chatID = msg.chat.id;
	json('https://api.kanttiinit.fi/menus/2')
	.then(body => {
		const subway = body[0].Menus[0].courses.find(m => m.title.match(/Subway\:/));
		if (subway) {
			bot.sendMessage(chatID, subway.title);
		} else {
			bot.sendMessage(chatID, 'No Subway today :(' );
		}
	});
});

bot.onText(/^\/restaurants/, (msg, match) => {
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

bot.on('location', (msg, match) => {
	postClosestRestaurants(msg, 3);
});


bot.on('inline_query', (msg) => {
	json('https://api.kanttiinit.fi/restaurants')
	.then(restaurants => {
		const results = [];
		const restaurant = restaurants.find(r => r.name.match(new RegExp('^' + msg.query, 'i')));
		if (restaurant) {
			const restaurantID = restaurant.id;
			const restaurantName = restaurant.name;
			json('https://api.kanttiinit.fi/menus/' + restaurantID)
			.then(restaurant => {
				const items = restaurant[0].Menus[0].courses
					.map(c => c.title)
					.join('\n');
				const menuMessage = 'https://api.kanttiinit.fi/restaurants/' + restaurantID + '/image';
				const result1 = {
					'type':'article',
					'id':msg.id,
					'title':restaurantName,
					'description':items,
					'input_message_content': {
						'message_text':menuMessage
					},
					'thumb_url':'https://api.kanttiinit.fi/restaurants/' + restaurantID + '/image',
					'thumb_width': 100,
					'thumb_height': 100
				};
				results.push(result1);
				bot.answerInlineQuery(msg.id, results);
			});
		} else {
			bot.answerInlineQuery(msg.id, []);
		}
	});
});

module.exports = bot;
