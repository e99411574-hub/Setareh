// ===== js/state.js — مدیریت وضعیت ستاره =====

var STATE = {
  _data: {},
  _listeners: {},

  // ============ راه‌اندازی ============
  init: function() {
    try {
      var saved = localStorage.getItem('setareh_state');
      if (saved) {
        this._data = JSON.parse(saved);
      } else {
        this._data = this._default();
        this.save();
      }
    } catch (e) {
      console.warn('STATE init error:', e);
      this._data = this._default();
    }
    console.log('📦 STATE: آماده');
  },

  _default: function() {
    return {
      user: {
        name: 'مهمان',
        avatar: 'male',
        avatarImage: '',
        bio: '',
        coins: 100,
        gems: 0,
        pani: 0,
        level: 1,
        streak: 0,
        ownedTicks: ['star_black'],
        selectedTick: 'star_black'
      },
      settings: {
        lang: 'fa',
        theme: 'theme_purple',
        sound: true,
        dark: false,
        vibrate: true,
        customTheme: null
      },
      currentView: 'home',
      sbUserData: null,
      missions: null,
      wheel: null,
      lottery: null
    };
  },

  // ============ ذخیره کل ============
  save: function() {
    try {
      localStorage.setItem('setareh_state', JSON.stringify(this._data));
    } catch (e) {
      console.warn('STATE save error:', e);
    }
  },

  saveUser: function() {
    this.save();
    this._emit('user', this._data.user);
  },

  // ============ get / set ============
  get: function(key) {
    if (!key) return this._data;
    if (key.indexOf('.') >= 0) {
      var parts = key.split('.');
      var cur = this._data;
      for (var i = 0; i < parts.length; i++) {
        if (cur == null) return undefined;
        cur = cur[parts[i]];
      }
      return cur;
    }
    return this._data[key];
  },

  set: function(key, value) {
    if (key.indexOf('.') >= 0) {
      var parts = key.split('.');
      var cur = this._data;
      for (var i = 0; i < parts.length - 1; i++) {
        if (cur[parts[i]] == null) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
    } else {
      this._data[key] = value;
    }
    this._emit(key, value);
  },

  // ============ کاربر ============
  getUser: function() {
    if (!this._data.user) this._data.user = this._default().user;
    return this._data.user;
  },

  // ============ سطح ============
  levelUp: function() {
    var u = this.getUser();
    u.level = (u.level || 1) + 1;
    this.saveUser(u);
    this._emit('levelup', u.level);
  },

  // ============ ریست ============
  reset: function() {
    this._data = this._default();
    this.save();
    try {
      localStorage.removeItem('setareh_state');
      localStorage.removeItem('setareh_settings');
      localStorage.removeItem('setareh_sb_session');
    } catch (e) {}
  },

  // ============ رویدادها ============
  on: function(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },

  off: function(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(function(f) { return f !== fn; });
  },

  _emit: function(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(function(fn) {
        try { fn(data); } catch (e) { console.warn('listener error:', e); }
      });
    }
  }
};

// ============ راه‌اندازی خودکار ============
if (typeof window !== 'undefined') {
  window.STATE = STATE;
}
