const TGBot = require('node-telegram-bot-api');

const token = process.env.TG_BOT_TOKEN;
const feedbackChat = process.env.CHAT_ID;
const api = require('./api');
const filters = require('./filters');

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

const defaultUseImage = false;

function postRestaurantImage(msg, restaurantID) {
	api.getRestaurantImage(restaurantID)
	.then( image => {
		bot.sendPhoto(msg.chat.id, image);
	}).catch( error => {
		bot.sendMessage(feedbackChat, error);
	});
};

function postRestaurantText(msg, restaurantID) {
	api.getRestaurantText(restaurantID)
	.then( menuText => {
		bot.sendMessage(msg.chat.id, menuText, {parse_mode:'HTML'});
	}).catch( error => {
		bot.sendMessage(msg.chat.id, 'Could not parse restaurant: ' + restaurantID);
	});
};

function postRestaurantWithID(msg, restaurantID, useImage = defaultUseImage) {
	if (useImage) {
		postRestaurantImage(msg, restaurantID);
	} else {
		postRestaurantText(msg, restaurantID);
	}
}

function postRestaurantWithName(msg, restaurantName, useImage = defaultUseImage) {
	api.getRestaurantID(restaurantName)
	.then( restaurantID => {
		if (useImage) {
			postRestaurantImage(msg, restaurantID);
		} else {
			postRestaurantText(msg, restaurantID);
		}
	}).catch( error => {
		bot.sendMessage(msg.chat.id, 'Invalid restaurant :(');
	});
};


function postRestaurants(msg, restaurants, useImage = defaultUseImage) {
	restaurants.forEach( restaurant => {
		if (useImage) {
			postRestaurantImage(msg, restaurant.id);
		} else {
			postRestaurantText(msg, restaurant.id);
		}
	});
}

function postClosestRestaurants(msg, n, useImage = defaultUseImage) {
	api.getClosestRestaurants(msg.location)
	.then( restaurants => {
		if (!restaurants.length) {
			bot.sendMessage(msg.chat.id, 'All restaurants are unavailable right now.');
		} else {
			const filtered = restaurants.filter( restaurant => {
				return filters.isOpen(restaurant);
			});
			if (filtered.length) {
				if (filtered.length > n) {
					postRestaurants(msg, filtered.splice(0, n), useImage);
				} else {
					postRestaurants(msg, filtered, useImage);
				}
			} else {
				bot.sendMessage(msg.chat.id, "All restaurants are closed right now.")
			}
		}
	});
};

function postAreaRestaurants(msg, areaName, useImage = defaultUseImage) {
	api.getAreaRestaurants(areaName)
	.then( restaurants => {
		postRestaurants(msg, restaurants, useImage);
	});
}

function postSubway(msg) {
	api.getSubway()
	.then( subway => {
		bot.sendMessage(msg.chat.id, subway);
	})
	.catch( error => {
		bot.sendMessage(msg.chat.id, 'No subway today :(');
	});
}

function postRestaurantSummary(msg) {
	api.getRestaurants()
	.then( restaurantString => {
		bot.sendMessage(msg.chat.id, restaurantString, {parse_mode:'HTML'});
	})
}

function requestLocation(msg) {
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
}

bot.onText(/^\/((?:.*)niemi|töölö|h(?:elsin)?ki|keskusta|stadi)/i, (msg, match) => {
	const areas = [
		{pattern: /h(elsin)?ki|keskusta|stadi/i, name: 'helsingin keskusta', suggestion: 'hki'},
		{pattern: /töölö/i, name: 'töölö', suggestion:'töölö'},
		{pattern: /(.*)niemi/i, name: 'otaniemi', suggestion:'niemi'}
	];

	const area = areas.find(a => match[1].match(a.pattern));

	if (msg.chat.type === 'private') {
		postAreaRestaurants(msg, area.name);
	} else {
		bot.sendMessage(msg.chat.id, "I don't want to spam group chats. Try /" + area.suggestion + ' in private!');
	}
});

bot.onText(/^\/food/, msg => {
	if (msg.chat.type === 'private') {
		requestLocation(msg);
	} else {
		bot.sendMessage(msg.chat.id, 'The /food command only works in private chats :(');
	}
});

bot.onText(/No, don't use my location./, msg => {
	bot.sendMessage(msg.chat.id, "Feel free to use the /menu command, then :)");
});

bot.onText(/^\/(menu|img|txt)(@Kanttiini(.+))?$/, (msg, match) => {
	bot.sendMessage(msg.chat.id, 'Give me a restaurant name or ID, please.\n(For example: '+ match[0] + ' 3)\n\nYou can get them with /restaurants');
});

bot.onText(/^\/(menu|im(?:a)?g(?:e)?) (.+)$/, (msg, match) => {
	const requested = match[2].toLowerCase();
	const chatID = msg.chat.id;
	if (isNaN(requested)) {
		postRestaurantWithName(msg, requested, true);
	} else {
		postRestaurantWithID(msg, requested, true);
	}
});

bot.onText(/^\/t(?:e)?xt (.+)$/, (msg, match) => {
	const requested = match[1].toLowerCase();
	if (isNaN(requested)) {
		api.getRestaurantID(requested)
		.then( restaurantID => {
			postRestaurantText(msg, restaurantID);
		});
	} else {
		postRestaurantText(msg, requested);
	}
});

bot.onText(/^\/sub/, msg => {
	postSubway(msg);
});

bot.onText(/^\/restaurants/, msg => {
	postRestaurantSummary(msg);
});

bot.on('location', msg => {
	postClosestRestaurants(msg, 3);
});

/*TODO: RETHINK THIS
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
*/

module.exports = bot;
