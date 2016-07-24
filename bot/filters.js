const moment = require('moment');

function dayShort(offset) {
	return moment().locale('fi').add(offset, 'days').format('dddd').toLowerCase().slice(0, 2);
}

function currentTime() {
	return moment().format('HH:mm');
}

module.exports = {
	isNear(restaurant) {
		if (restaurant.distance) {
			return restaurant.distance <= 5000;
		} else {
			return true;
		}
	},
	isOpen(restaurant) {
		const openingHours = restaurant.formattedOpeningHours[dayShort(0)];
		if (!openingHours || openingHours === 'closed') {
			return false;
		} else {
			const openFrom = openingHours.split(' - ')[0];
			const openTo = openingHours.split(' - ')[1];
			const timeNow = currentTime();
			return timeNow > openFrom && timeNow < openTo;
		}
	}
}
