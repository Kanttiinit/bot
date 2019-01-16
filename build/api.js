"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = require("node-fetch");
var request_1 = require("request");
var moment = require("moment");
function json(url) {
    return node_fetch_1.default(url).then(function (r) { return r.json(); });
}
function day(offset) {
    return moment().add(offset, 'day').format('YYYY-MM-DD');
}
function dayShort(offset) {
    return moment().locale('fi').add(offset, 'days').format('dddd')
        .toLowerCase()
        .slice(0, 2);
}
exports.default = {
    getClosestRestaurants: function (location) {
        var latitude = location.latitude, longitude = location.longitude;
        return json("https://api.kanttiinit.fi/restaurants?location=" + latitude + "," + longitude)
            .then(function (restaurants) { return restaurants; });
    },
    getRestaurantID: function (restaurantName) {
        return json('https://api.kanttiinit.fi/restaurants')
            .then(function (restaurants) {
            var restaurant = restaurants.find(function (r) { return r.name.match(new RegExp("^" + restaurantName, 'i')); });
            if (restaurant) {
                return restaurant.id;
            }
        });
    },
    getRestaurantImage: function (restaurantID) {
        return new Promise(function (resolve, reject) {
            var restaurantUrl = "https://api.kanttiinit.fi/restaurants/" + restaurantID + "/image";
            request_1.default({
                url: restaurantUrl,
                encoding: null,
            }, function (err, response, buffer) {
                if (response && response.statusCode === 200) {
                    resolve(buffer);
                }
                else {
                    reject("(BOT) Error " + response.statusCode + ": postRestaurantWithID with restaurantID " + restaurantID);
                }
            });
        });
    },
    getRestaurantText: function (restaurantID) {
        return json("https://api.kanttiinit.fi/menus/" + restaurantID)
            .then(function (restaurantData) {
            var dayOffset = 0;
            var name = restaurantData[0].name;
            var today = day(dayOffset);
            var todayShort = dayShort(dayOffset);
            var openingHours = restaurantData[0].formattedOpeningHours[dayShort(dayOffset)];
            var dataToday = restaurantData[0].Menus.find(function (r) { return r.day.match(new RegExp("^" + today, 'i')); });
            if (dataToday) {
                var courses = dataToday.courses.map(function (c) { return c.title + " <i>" + c.properties.join(' ') + "</i>"; }).join('\n');
                return "<b>" + name + "</b> (" + openingHours + ")\n" + courses;
            }
            return "<b>" + name + "</b>\nNo menu available.";
        });
    },
    getAreaRestaurants: function (areaName) {
        return json('https://api.kanttiinit.fi/areas')
            .then(function (areas) {
            var area = areas.find(function (area) { return area.name.match(new RegExp(areaName, 'i')); });
            if (area) {
                return area.Restaurants.sort(function (a, b) { return (a.name < b.name ? -1 : 1); });
            }
        });
    },
    getSubway: function () {
        return json('https://api.kanttiinit.fi/menus/2')
            .then(function (restaurantData) {
            var today = day(0);
            var dataToday = restaurantData[0].Menus.find(function (r) { return r.day.match(new RegExp(today, 'i')); });
            if (dataToday) {
                var subway = dataToday.courses.find(function (m) { return m.title.match(/Subway\:/); });
                if (subway) {
                    return subway.title;
                }
                return 'No subway today :(';
            }
            return 'No food at T-Talo today.';
        });
    },
    getRestaurants: function () {
        return json('https://api.kanttiinit.fi/restaurants');
    },
    getRestaurantsFormatted: function () {
        return json('https://api.kanttiinit.fi/restaurants')
            .then(function (restaurants) {
            var today = dayShort(0);
            var formattedRestaurants = restaurants
                .sort(function (a, b) { return (a.name < b.name ? -1 : 1); })
                .map(function (r) { return "<b>" + r.name + "</b> (" + r.formattedOpeningHours[today] + ") " + ("[" + r.id + "]"); });
            return ['<b>Name</b> (Opening Hours) [ID]\n'].concat(formattedRestaurants).join('\n');
        });
    },
    interpretVoice: function (fileLink) {
        return new Promise(function (resolve, reject) {
            request_1.default.post('https://audio.kanttiinit.fi/', { audioFileUrl: fileLink }, function (err, response, body) {
                if (response && response.statusCode === 200) {
                    resolve(body);
                }
                else {
                    reject('(BOT) Error Could not be processed');
                }
            });
        });
    },
};
//# sourceMappingURL=api.js.map