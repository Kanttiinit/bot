const fetch = require('node-fetch');
const request = require('request');
const moment = require('moment');

function json(url) {
	return fetch(url).then(r => r.json());
}

function dayShort(offset) {
	return moment().add(offset).format('dddd').toLowerCase().slice(0, 2);
}

module.exports = {
	getClosestRestaurants(location, n) {
		const {latitude, longitude} = location;
		return json('https://api.kanttiinit.fi/restaurants?location=' + latitude + ',' + longitude)
		.then(restaurants => restaurants.splice(0, n));
	},
	getRestaurantID(restaurantName) {
		return json('https://api.kanttiinit.fi/restaurants')
		.then(restaurants => {
			const restaurant = restaurants.find(r => r.name.match(new RegExp('^' + restaurantName, 'i')));
			if (restaurant) {
				return restaurant.id;
			}
		});
	},
	getRestaurantImage(restaurantID) {
		return new Promise((resolve, reject) => {
			const restaurantUrl = 'https://api.kanttiinit.fi/restaurants/' + restaurantID + '/image';
			request({
				url: restaurantUrl,
				encoding: null
			}, function(err, response, buffer) {
				if (response && response.statusCode === 200) {
					resolve(buffer);
				} else {
					bot.sendMessage(feedbackChat,
						'(BOT) Error ' + response.statusCode + ': postRestaurantWithID with restaurantID ' + restaurantID);
					reject();
				}
			});
		});
	},
	getRestaurantText(restaurantID) {
		return json('https://api.kanttiinit.fi/menus/' + restaurantID)
		.then(restaurantData => {
			const today = dayShort(0);
			const name = restaurantData[0].name;
			const openingHours = restaurantData[0].formattedOpeningHours[today];
			const courses = restaurantData[0].Menus[0].courses;
			var result = '<b>' + name + '</b> (' + openingHours + ')\n' +
				courses.map(c => c.title + ' <i>' + c.properties.join(' ') + '</i>').join('\n');
			return result;
		});
	},
	getAreaRestaurants(areaName) {
		return json('https://api.kanttiinit.fi/areas')
		.then(areas => {
			const area = areas.find(area => area.name.match(new RegExp(areaName, 'i')));
			if (area) {
				return area.Restaurants.sort((a, b) => a.name < b.name ? -1 : 1);
			}
		});
	},
	getSubway() {
		return json('https://api.kanttiinit.fi/menus/2')
		.then(body => {
			const subway = body[0].Menus[0].courses.find(m => m.title.match(/Subway\:/));
			if (subway) {
				return subway.title;
			}
		});
	},
	getRestaurants() {
		return json('https://api.kanttiinit.fi/restaurants')
		.then(restaurants => {
			return restaurants
			.sort((a, b) => a.name < b.name ? -1 : 1)
			.map(r => r.name + ': ' + r.id)
			.join('\n');
		});
	}
}
