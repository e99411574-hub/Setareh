// ===== supabase-client.js - اتصال به Supabase بدون کتابخانه =====
// فقط با fetch API — بدون CDN، بدون وابستگی

var SUPABASE_URL = 'https://qsibyylhwfadlyoqlemt.supabase.co';
var SUPABASE_KEY = 'sb_publishable_b5P5qNBF0jaA-nBN8pxrBQ_X5SMzc2w';

var SB = {
  _session: null,
  _user: null,

  // ============ درخواست به Supabase ============
  _request: function(path, options) {
    options = options || {};
    var url = SUPABASE_URL + path;
    var headers = {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json'
    };

    if (this._session && this._session.access_token) {
      headers['Authorization'] = 'Bearer ' + this._session.access_token;
    } else {
      headers['Authorization'] = 'Bearer ' + SUPABASE_KEY;
    }

    if (options.headers) {
      for (var key in options.headers) {
        headers[key] = options.headers[key];
      }
    }

    var fetchOptions = {
      method: options.method || 'GET',
      headers: headers
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    return fetch(url, fetchOptions).then(function(res) {
      var contentType = res.headers.get('content-type') || '';
      var parsePromise;
      if (contentType.indexOf('application/json') >= 0) {
        parsePromise = res.json();
      } else {
        parsePromise = res.text();
      }
      return parsePromise.then(function(data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    });
  },

  // ============ راه‌اندازی ============
  init: function() {
    try {
      var saved = localStorage.getItem('setareh_sb_session');
      if (saved) {
        this._session = JSON.parse(saved);
        this._user = this._session.user || null;
      }
    } catch (e) {
      console.warn('SB session load error:', e);
    }
    console.log('✅ SB (بدون کتابخانه) آماده شد');
    return true;
  },

  isReady: function() {
    return true;
  },

  // ============ تست اتصال ============
  testConnection: function() {
    return this._request('/rest/v1/users?select=id&limit=1', { method: 'GET' })
      .then(function(res) {
        if (res.ok) {
          console.log('✅ SB test success');
          return true;
        }
        console.log('✅ SB connected (status ' + res.status + ')');
        return true;
      })
      .catch(function(err) {
        console.error('❌ SB test failed:', err);
        throw err;
      });
  },

  // ============ ثبت‌نام (Sign Up) ============
  signUp: function(email, password, metadata) {
    var self = this;
    return this._request('/auth/v1/signup', {
      method: 'POST',
      body: {
        email: email,
        password: password,
        data: metadata || {}
      }
    }).then(function(res) {
      if (!res.ok) {
        var msg = 'خطا در ثبت‌نام';
        if (res.data && res.data.message) msg = res.data.message;
        if (res.data && res.data.error_description) msg = res.data.error_description;
        throw new Error(msg);
      }
      if (res.data.access_token) {
        self._session = res.data;
        self._user = res.data.user;
        self._saveSession();
      }
      return res.data;
    });
  },

  // ============ ورود مهمان (Anonymous) ============
  signInAnonymously: function() {
    var self = this;
    return this._request('/auth/v1/signup', {
      method: 'POST',
      body: {}
    }).then(function(res) {
      if (!res.ok) {
        var msg = 'خطا در ورود مهمان';
        if (res.data && res.data.message) msg = res.data.message;
        if (res.data && res.data.error_description) msg = res.data.error_description;
        throw new Error(msg);
      }
      if (res.data.access_token) {
        self._session = res.data;
        self._user = res.data.user;
        self._saveSession();
      }
      return res.data;
    });
  },

  // ============ ورود (Sign In) ============
  signIn: function(email, password) {
    var self = this;
    return this._request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: {
        email: email,
        password: password
      }
    }).then(function(res) {
      if (!res.ok) {
        var msg = 'ایمیل یا رمز اشتباهه';
        if (res.data && res.data.error_description) msg = res.data.error_description;
        if (res.data && res.data.message) msg = res.data.message;
        throw new Error(msg);
      }
      self._session = res.data;
      self._user = res.data.user;
      self._saveSession();
      return res.data;
    });
  },

  // ============ OTP ============
  signInWithOtp: function(email) {
    return this._request('/auth/v1/otp', {
      method: 'POST',
      body: { email: email, create_user: true }
    }).then(function(res) {
      if (!res.ok) throw new Error('خطا در ارسال کد');
      return true;
    });
  },

  verifyOtp: function(email, token) {
    var self = this;
    return this._request('/auth/v1/verify', {
      method: 'POST',
      body: { email: email, token: token, type: 'email' }
    }).then(function(res) {
      if (!res.ok) throw new Error('کد اشتباهه');
      self._session = res.data;
      self._user = res.data.user;
      self._saveSession();
      return res.data;
    });
  },

  // ============ خروج ============
  signOut: function() {
    var self = this;
    return this._request('/auth/v1/logout', { method: 'POST' })
      .then(function() {
        self._session = null;
        self._user = null;
        localStorage.removeItem('setareh_sb_session');
      })
      .catch(function() {
        self._session = null;
        self._user = null;
        localStorage.removeItem('setareh_sb_session');
      });
  },

  // ============ کاربر فعلی ============
  getUser: function() { return this._user; },
  getSession: function() { return this._session; },
  isLoggedIn: function() { return this._session !== null && this._user !== null; },

  // ============ ذخیره سشن ============
  _saveSession: function() {
    try {
      if (this._session) {
        localStorage.setItem('setareh_sb_session', JSON.stringify(this._session));
      }
    } catch (e) {
      console.warn('SB save session error:', e);
    }
  },

  // ============ خواندن از دیتابیس ============
  from: function(table) {
    var self = this;
    var basePath = '/rest/v1/' + table;
    var filters = [];
    var selectCols = '*';
    var orderCol = null;
    var limitNum = null;
    var isSingle = false;

    var api = {
      select: function(cols) { selectCols = cols || '*'; return api; },
      eq: function(col, val) { filters.push(col + '=eq.' + encodeURIComponent(val)); return api; },
      neq: function(col, val) { filters.push(col + '=neq.' + encodeURIComponent(val)); return api; },
      order: function(col, opts) {
        var dir = (opts && opts.ascending === false) ? 'desc' : 'asc';
        orderCol = col + '.' + dir;
        return api;
      },
      limit: function(n) { limitNum = n; return api; },
      single: function() { isSingle = true; return api; },
      then: function(resolve, reject) {
        var query = '?select=' + selectCols;
        for (var i = 0; i < filters.length; i++) query += '&' + filters[i];
        if (orderCol) query += '&order=' + orderCol;
        if (limitNum) query += '&limit=' + limitNum;

        var headers = {};
        if (isSingle) headers['Accept'] = 'application/vnd.pgrst.object+json';

        return self._request(basePath + query, {
          method: 'GET',
          headers: headers
        }).then(function(res) {
          if (!res.ok) {
            if (reject) reject(new Error(res.data.message || 'خطا در خواندن'));
            else return { data: null, error: res.data };
          }
          if (resolve) resolve({ data: res.data, error: null });
          return { data: res.data, error: null };
        }).catch(function(err) {
          if (reject) reject(err);
          return { data: null, error: { message: err.message } };
        });
      }
    };
    return api;
  },

  // ============ نوشتن در دیتابیس ============
  insert: function(table, data) {
    return this._request('/rest/v1/' + table, {
      method: 'POST',
      body: data,
      headers: { 'Prefer': 'return=representation' }
    }).then(function(res) {
      if (!res.ok) throw new Error(res.data.message || 'خطا در ذخیره');
      return res.data;
    });
  },

  update: function(table, data, filters) {
    var query = '';
    if (filters) {
      var parts = [];
      for (var key in filters) {
        parts.push(key + '=eq.' + encodeURIComponent(filters[key]));
      }
      if (parts.length) query = '?' + parts.join('&');
    }
    return this._request('/rest/v1/' + table + query, {
      method: 'PATCH',
      body: data,
      headers: { 'Prefer': 'return=representation' }
    }).then(function(res) {
      if (!res.ok) throw new Error(res.data.message || 'خطا در به‌روزرسانی');
      return res.data;
    });
  },

  delete: function(table, filters) {
    var query = '';
    if (filters) {
      var parts = [];
      for (var key in filters) {
        parts.push(key + '=eq.' + encodeURIComponent(filters[key]));
      }
      if (parts.length) query = '?' + parts.join('&');
    }
    return this._request('/rest/v1/' + table + query, {
      method: 'DELETE'
    }).then(function(res) {
      if (!res.ok) throw new Error(res.data.message || 'خطا در حذف');
      return true;
    });
  }
};

window.SB = SB;
