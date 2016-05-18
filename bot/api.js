const fetch = require('node-fetch');
const request = require('request');
const moment = require('moment');

function json(url) {
	return fetch(url).then(r => r.json());
}

function dayShort(offset) {
	return moment().add(offset).format('dddd').toLowerCase().slice(0, 2);
}

function currentTime() {
	return moment().format('HH:mm');
}

function openingHours(restaurantID) {
	return json('https://api.kanttiinit.fi/restaurants')
	.then(restaurants => {
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
	isNear(restaurant) {
		if(restaurant.distance) {
			return restaurant.distance <= 5000;
		} else {
			return true;
		}
	},
	isOpen(restaurant) {
		const openingHours = restaurant.formattedOpeningHours[dayShort(0)];
		if (openingHours === 'closed') {
			return false;
		} else {
			const openFrom = openingHours.split(' - ')[0];
			const openTo = openingHours.split(' - ')[1];
			const timeNow = currentTime();
			return timeNow > openFrom && timeNow < openTo;
		}
	},
	getClosestRestaurants(location, n) {
		const {latitude, longitude} = location;
		return json('https://api.kanttiinit.fi/restaurants?location=' + latitude + ',' + longitude)
		.then(restaurants => {
			const result = restaurants
			.filter(restaurant => this.isOpen(restaurant) && this.isNear(restaurant))
			.splice(0, n);
			return result;
		});
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
					reject('(BOT) Error ' + response.statusCode + ': postRestaurantWithID with restaurantID ' + restaurantID);
				}
			});
		});
	},
	getRestaurantText(restaurantID) {
		return json('https://api.kanttiinit.fi/menus/' + restaurantID)
		.then(restaurantData => {
			const name = restaurantData[0].name;
			const openingHours = restaurantData[0].formattedOpeningHours[dayShort(0)];
			const courses = restaurantData[0].Menus[0].courses;
			const result = '<b>' + name + '</b> (' + openingHours + ')\n' +
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
			const today = dayShort(0);
			const formattedRestaurants = restaurants
			.sort((a, b) => a.name < b.name ? -1 : 1)
			.map(r => '<b>' + r.name + '</b> (' + r.formattedOpeningHours[today] + ') ' + '[' + r.id + ']')
			return['<b>Name</b> (Opening Hours) [ID]\n'].concat(formattedRestaurants).join('\n');
			//.unshift('<b>name<b>, (openingHours), ID')
			//.join('\n');
		});
	}
}
