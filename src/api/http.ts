import fetch from 'node-fetch';

const API_ROOT = 'https://kitchen.kanttiinit.fi';

export default {
  getJson(path: string) {
    return fetch(API_ROOT + path).then(res => res.json());
  },
};
