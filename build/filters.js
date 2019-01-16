"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var moment = require("moment");
function dayShort(offset) {
    return moment().locale('fi').add(offset, 'days').format('dddd')
        .toLowerCase()
        .slice(0, 2);
}
function currentTime() {
    return moment().format('HH:mm');
}
exports.default = {
    isNear: function (restaurant) {
        if (restaurant.distance) {
            return restaurant.distance <= 5000;
        }
        return true;
    },
    isOpen: function (restaurant) {
        var openingHours = restaurant.formattedOpeningHours[dayShort(0)];
        if (!openingHours || openingHours === 'closed') {
            return false;
        }
        var openFrom = openingHours.split(' - ')[0];
        var openTo = openingHours.split(' - ')[1];
        var timeNow = currentTime();
        return timeNow > openFrom && timeNow < openTo;
    },
};
//# sourceMappingURL=filters.js.map