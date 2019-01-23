import { Area, DateMenu, Restaurant } from './types';
import http from './http';

import moment = require('moment');

async function getAreas(): Promise<Array<Area>> {
  return http.getJson('/areas');
}

async function getArea(areaId: number): Promise<Area> {
  const areasJson = await getAreas();
  return areasJson.find((area: Area) => area.id === areaId);
}

async function getRestaurants(): Promise<Array<Restaurant>> {
  return http.getJson('/restaurants');
}

async function getRestaurantWithMenuForDate(restaurantId: number, date: Date): Promise<Restaurant> {
  const day = moment(date).format('YYYY-MM-DD');
  const restaurantJson = await http.getJson(`/restaurants/${restaurantId}/menu?day=${day}`);
  return restaurantJson;
}

async function getRestaurantWithMenu(restaurantId: number): Promise<Restaurant> {
  const day = new Date();
  const restaurantJson = await getRestaurantWithMenuForDate(restaurantId, day);
  return restaurantJson;
}

async function getMenuForRestaurant(restaurantId: number): Promise<DateMenu> {
  const menuJson = await http.getJson(`menus/?restaurants=${restaurantId}`);
  return menuJson;
}

async function getRestaurantsNearCoords(lat: number, lon: number): Promise<Array<Restaurant>> {
  const restaurants = await http.getJson(`/restaurants?location=${lat},${lon}`);
  return restaurants;
}

export default {
  getAreas,
  getArea,
  getRestaurants,
  getRestaurantWithMenuForDate,
  getRestaurantWithMenu,
  getRestaurantsNearCoords,
  getMenuForRestaurant,
};
