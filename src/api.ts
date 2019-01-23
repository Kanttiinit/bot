import kitchen from './api/kitchen';

import moment = require('moment');

function getTodayAsDayOfWeek(): number {
  const dayOfWeek = Number(moment().format('d'));
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

export default {
  getClosestRestaurants(location: { latitude: number; longitude: number }) {
    const { latitude, longitude } = location;
    return kitchen.getRestaurantsNearCoords(latitude, longitude);
  },
  async getRestaurantID(restaurantName: string): Promise<number> {
    const restaurants = await kitchen.getRestaurants();
    const restaurant = restaurants.find(
      r => r.name.toLowerCase() === restaurantName.toLowerCase(),
    );
    return restaurant ? restaurant.id : undefined;
  },
  async getRestaurantText(restaurantId: number) {
    const restaurant = await kitchen.getRestaurantWithMenu(restaurantId);
    const { name, openingHours } = restaurant;
    const menu = restaurant.menus[0];
    const dayIndex = getTodayAsDayOfWeek();
    if (menu && menu.courses && menu.courses.length > 0) {
      const courses = menu.courses
        .map(c => `${c.title} <i>${c.properties.join(' ')}</i>`)
        .join('\n');
      return `<b>${name}</b> (${openingHours[dayIndex] || 'closed'})\n${courses}`;
    }
    return `<b>${name}</b>\nNo menu available.`;
  },
  async getAreaRestaurants(areaName: string) {
    const areas = await kitchen.getAreas();
    const area = areas.find(
      a => a.name.toLowerCase() === areaName.toLowerCase(),
    );
    return area.restaurants.sort((a, b) => (a.name < b.name ? -1 : 1));
  },
  async getSubway() {
    const restaurant = await kitchen.getRestaurantWithMenu(2);
    const subwayMenu = restaurant.menus[0].courses.find(m => m.title.includes('Subway'));
    if (subwayMenu) {
      return subwayMenu.title;
    }
    return 'Subway menu not available';
  },
  async getRestaurants() {
    return kitchen.getRestaurants();
  },
  async getRestaurantsFormatted() {
    const restaurants = await kitchen.getRestaurants();
    const dayIndex = getTodayAsDayOfWeek();
    const formattedRestaurants = restaurants
      .sort((a, b) => (a.name < b.name ? -1 : 1))
      .map(r => `<b>${r.name}</b> (${r.openingHours[dayIndex] || 'closed'}) [${r.id}]`);
    return ['<b>Name</b> (Opening Hours) [ID]\n']
      .concat(formattedRestaurants)
      .join('\n');
  },
};
