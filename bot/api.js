const fetch = require('node-fetch');
const RSVP = require('rsvp');
const request = require('request');

function json(url) {
	return fetch(url).then(r => r.json());
}

module.exports = {
	getClosestRestaurants: (location, n) => {
		const promise = new RSVP.Promise( (resolve, reject) => {
			const loc = location;
			json('https://api.kanttiinit.fi/restaurants?location=' + loc.latitude + ',' + loc.longitude)
			.then( restaurants => {
				if(restaurants) {
					resolve(restaurants.splice(0, n));
				} else {
					reject(this);
				}
			});
		});
		return promise;
	},
	getRestaurantID: (restaurantName) => {
		const promise = new RSVP.Promise( (resolve, reject) => {
			json('https://api.kanttiinit.fi/restaurants')
			.then(restaurants => {
				const restaurant = restaurants.find(r => r.name.match(new RegExp('^' + restaurantName, 'i')));
				if (restaurant) {
					resolve(restaurant.id);
				} else {
					reject(this);
				}
			});
		})
		return promise;
	},
	getRestaurantImage: (restaurantID) => {
		const promise = new RSVP.Promise( (resolve, reject) => {
			const restaurantUrl = 'https://api.kanttiinit.fi/restaurants/' + restaurantID + '/image';
			if(json(restaurantUrl) === 'no such Restaurant'){
				reject(this);
			} else {
				request({
					url: restaurantUrl,
					encoding: null
				}, function(err, response, buffer) {
					if (response && response.statusCode === 200) {
						resolve(buffer);
					} else {
						bot.sendMessage(feedbackChat,
							'(BOT) Error ' + response.statusCode + ': postRestaurantWithID with restaurantID ' + restaurantID);
							reject(this);
						}
					});
				}
		});
		return promise;
	},
	getRestaurantText: (restaurantID) => {
		const promise = new RSVP.Promise( (resolve, reject) => {
			const restaurantUrl = 'https://api.kanttiinit.fi/menus/' + restaurantID;
			var result = "";
			json(restaurantUrl)
			.then(restaurantData => {
				const name = restaurantData[0].name;
				const openingHours = restaurantData[0].openingHours[0].join(" - ")
				const courses = restaurantData[0].Menus[0].courses;
				result = '<b>' + name + '</b> [' + openingHours + ']\n';
				for(var i = 0; i < courses.length; i++) {
					result += courses[i].title + ' <i>' + courses[i].properties.join(" ") + '</i>\n';
				}
				resolve(result)
			});
		});
		return promise;
	},
	getAreaRestaurants: (areaName) => {
		const promise = new RSVP.Promise( (resolve, reject) => {
			json('https://api.kanttiinit.fi/areas')
			.then(areas => {
				const area = areas.find(item => item.name.match(new RegExp(areaName, 'i')));
				if(area) {
					const sorted = area.Restaurants.sort((a, b) => a.name < b.name ? -1 : 1)
					resolve(sorted);
				} else {
					reject(this);
				}
			});
		});
		return promise;
	},
	getSubway: () => {
		const promise = new RSVP.Promise( (resolve, reject) => {
			json('https://api.kanttiinit.fi/menus/2')
			.then(body => {
				const subway = body[0].Menus[0].courses.find(m => m.title.match(/Subway\:/));
				if (subway) {
					resolve(subway.title);
				} else {
					reject(this);
				}
			});
		});
		return promise;
	},
	getRestaurants: () => {
		const promise = new RSVP.Promise( (resolve, reject) => {
			json('https://api.kanttiinit.fi/restaurants')
			.then(restaurants => {
				const restaurantString = restaurants
				.sort((a, b) => a.name < b.name ? -1 : 1)
				.map(r => r.name + ': ' + r.id)
				.join('\n');

				resolve(restaurantString);
			});
		});
		return promise;
	}
}
