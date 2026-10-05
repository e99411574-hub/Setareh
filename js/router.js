// ===== router.js — مسیریاب بین صفحات ستاره =====

var ROUTER = {
  routes: {},
  current: null,
  history: [],

  register: function(name, config) {
    this.routes[name] = config || {};
    return this;
  },

  go: function(name, params) {
    if (!this.routes[name]) { console.warn('ROUTER: not found —', name); return false; }
    if (this.current && this.current !== name) {
      this.hide(this.current);
      this.history.push(this.current);
      if (this.history.length > 20) this.history.shift();
    }
    this.current = name;
    this.show(name);
    var cfg = this.routes[name];
    if (typeof cfg.onEnter === 'function') {
      try { cfg.onEnter(params || {}); } catch (e) { console.warn('onEnter error:', e); }
    }
    if (typeof STATE !== 'undefined') STATE.set('currentView', name);
    if (window.location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    try { window.scrollTo(0, 0); } catch (e) {}
    if (typeof playSnd === 'function') playSnd('tap');
    return true;
  },

  back: function() {
    var prev = this.history.pop();
    if (prev) { this.current = null; this.go(prev); }
    else { this.go('home'); }
  },

  show: function(name) {
    var el = document.getElementById('view-' + name);
    if (el) {
      el.classList.add('active');
      el.style.display = 'block';
      el.classList.remove('anim-slide-up');
      void el.offsetWidth;
      el.classList.add('anim-slide-up');
    }
    var navs = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < navs.length; i++) {
      navs[i].classList.remove('active');
      if (navs[i].getAttribute('data-view') === name) navs[i].classList.add('active');
    }
  },

  hide: function(name) {
    var el = document.getElementById('view-' + name);
    if (el) { el.classList.remove('active'); el.style.display = 'none'; }
  },

  hideAll: function() {
    var views = document.querySelectorAll('.view');
    for (var i = 0; i < views.length; i++) {
      views[i].classList.remove('active');
      views[i].style.display = 'none';
    }
  },

  init: function() {
    this.register('home',     { onEnter: this._enterHome.bind(this) });
    this.register('games',    { onEnter: this._enterGames.bind(this) });
    this.register('tools',    { onEnter: this._enterTools.bind(this) });
    this.register('shop',     { onEnter: this._enterShop.bind(this) });
    this.register('profile',  { onEnter: this._enterProfile.bind(this) });
    this.register('settings', { onEnter: this._enterSettings.bind(this) });
    this.register('auth',     { onEnter: this._enterAuth.bind(this) });
    this.register('chat',     { onEnter: this._enterChat.bind(this) });

    window.addEventListener('hashchange', this._onHashChange.bind(this));
    window.addEventListener('popstate', this._onHashChange.bind(this));

    var hash = (window.location.hash || '').replace('#', '');
    var start = (hash && this.routes[hash]) ? hash : 'home';
    this.current = start;
    this.show(start);
    var cfg = this.routes[start];
    if (cfg && typeof cfg.onEnter === 'function') {
      try { cfg.onEnter({}); } catch (e) { console.warn(e); }
    }
  },

  _onHashChange: function() {
    var hash = (window.location.hash || '').replace('#', '');
    if (hash && this.routes[hash] && hash !== this.current) {
      this.hideAll();
      this.current = hash;
      this.show(hash);
      var cfg = this.routes[hash];
      if (cfg && typeof cfg.onEnter === 'function') {
        try { cfg.onEnter({}); } catch (e) {}
      }
    }
  },

  // ============ توابع ورود به صفحات ============
  _enterHome: function() {
    if (typeof APP !== 'undefined' && APP.renderHome) APP.renderHome();
  },

  _enterGames: function() {
    if (typeof APP !== 'undefined' && APP.renderGamesMenu) APP.renderGamesMenu();
  },

  _enterTools: function() {
    if (typeof APP !== 'undefined' && APP.renderToolsMenu) APP.renderToolsMenu();
  },

  _enterShop: function() {
    var c = document.getElementById('shopContent');
    if (c && typeof SHOP !== 'undefined' && SHOP.render) {
      c.innerHTML = SHOP.render();
      if (typeof SHOP.bindEvents === 'function') SHOP.bindEvents(c);
    }
    if (typeof MISSIONS !== 'undefined') MISSIONS.trackShop();
  },

  _enterProfile: function() {
    var c = document.getElementById('profileContent');
    if (c && typeof PROFILE !== 'undefined' && PROFILE.render) {
      c.innerHTML = PROFILE.render();
    }
  },

  _enterSettings: function() {
    if (typeof APP !== 'undefined' && APP.renderSettings) APP.renderSettings();
  },

  _enterAuth: function() {
    if (typeof AUTH !== 'undefined' && AUTH.start) AUTH.start();
  },

  _enterChat: function() {
    if (typeof CHAT !== 'undefined' && CHAT.render) {
      CHAT.render();
    }
  }
};

window.ROUTER = ROUTER;
