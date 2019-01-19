// https://kitchen.kanttiinit.fi/areas

type url = string;

export type OpeningHour = Array<string | null>;

export type MenuItem = {
  title: string;
  properties: string[];
};

export type DateMenu = {
  [date: string]: MenuItem;
};

export type RestaurantMenu = {
  day: string;
  courses: Array<MenuItem>;
};

export type Restaurant = {
  id: number;
  name: string;
  type: url;
  latitude: number;
  longitude: number;
  address: string;
  openingHours: OpeningHour[];
  menus: Array<RestaurantMenu> | null;
};

export type Area = {
  id: number;
  name: string;
  image: url | null;
  latitude: number;
  longitude: number;
  locationRadius: number;
  mapImageUrl: url;
  restaurants: Restaurant[];
};
