const fetch = require('node-fetch');
const request = require('request');
const moment = require('moment');

function json(url) {
	return fetch(url).then(r => r.json());
}

function dayShort(offset) {
	return moment().locale('fi').add(offset, 'day').format('dddd').toLowerCase().slice(0, 2);
}

function day(offset) {
	return moment().add(offset, 'day').format('YYYY-MM-DD');
}

function openingHours(restaurantID) {
	return json('https://api.kanttiinit.fi/restaurants')
	.then( restaurants => {
		const restaurant = restaurants.find(r => r.id === restaurantID);
		if (restaurant) {
			const openingHours = restaurant.formattedOpeningHours[dayShort(0)];
			if(openingHours) {
				return openingHours;
			} else {
				return "closed";
			}
		}
	});
}

module.exports = {
	getClosestRestaurants(location) {
		const {latitude, longitude} = location;
		return json('https://api.kanttiinit.fi/restaurants?location=' + latitude + ',' + longitude)
		.then(restaurants => {
			return restaurants;
		});
	},
	getRestaurantID(restaurantName) {
		return json('https://api.kanttiinit.fi/restaurants')
		.then( restaurants => {
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
					reject('(BOT) Error ' + response.statusCode + ': postRestaurantWithID with restaurantID ' + restaurantID);
				}
			});
		});
	},
	getRestaurantText(restaurantID) {
		return json('https://api.kanttiinit.fi/menus/' + restaurantID)
		.then( restaurantData => {
			const dayOffset = 0;
			const name = restaurantData[0].name;
			const today = day(dayOffset);
			const todayShort = dayShort(dayOffset);
			const openingHours = restaurantData[0].formattedOpeningHours[dayShort(dayOffset)];
			const dataToday = restaurantData[0].Menus.find( r => r.day.match(new RegExp('^' + today, 'i')));
			if (dataToday) {
				const courses = dataToday.courses.map(c => c.title + ' <i>' + c.properties.join(' ') + '</i>').join('\n');
				return '<b>' + name + '</b> (' + openingHours + ')\n' + courses;
			} else {
				return '<b>' + name + '</b>\nNo menu available.';
			}
		});
	},
	getAreaRestaurants(areaName) {
		return json('https://api.kanttiinit.fi/areas')
		.then( areas => {
			const area = areas.find(area => area.name.match(new RegExp(areaName, 'i')));
			if (area) {
				return area.Restaurants.sort((a, b) => a.name < b.name ? -1 : 1);
			}
		});
	},
	getSubway() {
		return json('https://api.kanttiinit.fi/menus/2')
		.then( restaurantData => {
			const today = day(0);
			const dataToday = restaurantData[0].Menus.find( r => r.day.match(new RegExp(today, 'i')));
			if (dataToday) {
				const subway = dataToday.courses.find( m => m.title.match(/Subway\:/));
				if (subway) {
					return subway.title;
				} else {
					return 'No subway today :(';
				}
			} else {
				return "No food at T-Talo today.";
			}
		});
	},
	getRestaurants() {
		return json('https://api.kanttiinit.fi/restaurants')
		.then( restaurants => {
			const today = dayShort(0);
			const formattedRestaurants = restaurants
			.sort((a, b) => a.name < b.name ? -1 : 1)
			.map(r => '<b>' + r.name + '</b> (' + r.formattedOpeningHours[today] + ') ' + '[' + r.id + ']')
			return['<b>Name</b> (Opening Hours) [ID]\n'].concat(formattedRestaurants).join('\n');
		});
	}
}
