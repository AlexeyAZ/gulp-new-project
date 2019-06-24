import '@babel/polyfill';
import svg4everybody from 'svg4everybody';

const app = {
  load: () => {
    app.bindEvents();
  },

  bindEvents: () => {
    svg4everybody();
  }
};

window.addEventListener('load', app.load);
