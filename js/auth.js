// ===== auth.js - ورود و ثبت‌نام کاربران =====

var AUTH = {
  mode: 'login',
  loading: false,
  error: '',
  success: '',

  // ============ شروع ============
  init: function() {
    this.mode = 'login';
    this.error = '';
    this.success = '';
    this.loading = false;
    // اگه کاربر قبلاً لاگین کرده، سشنش رو بارگذاری کن
    if (typeof SB !== 'undefined' && SB.init) SB.init();
    this.refresh();
  },

  start: function() {
    this.mode = 'login';
    this.error = '';
    this.success = '';
    this.loading = false;
    this.refresh();
  },

  // ============ تغییر تب ============
  setMode: function(mode) {
    this.mode = mode;
    this.error = '';
    this.success = '';
    if (typeof playSnd === 'function') playSnd('tap');
    this.refresh();
  },

  // ============ ارسال فرم ============
  submit: function() {
    if (this.loading) return;

    var emailEl = document.getElementById('authEmail');
    var passEl = document.getElementById('authPassword');
    if (!emailEl || !passEl) return;

    var email = emailEl.value.trim();
    var password = passEl.value;

    this.error = '';
    this.success = '';

    if (!email || email.indexOf('@') < 0) {
      this.error = 'ایمیل معتبر وارد کن';
      emailEl.classList.add('error');
      setTimeout(function() { emailEl.classList.remove('error'); }, 500);
      if (typeof playSnd === 'function') playSnd('error');
      this.refresh();
      return;
    }

    if (!password || password.length < 6) {
      this.error = 'رمز عبور باید حداقل ۶ کاراکتر باشه';
      passEl.classList.add('error');
      setTimeout(function() { passEl.classList.remove('error'); }, 500);
      if (typeof playSnd === 'function') playSnd('error');
      this.refresh();
      return;
    }

    this.loading = true;
    this.refresh();

    var self = this;
    var promise;

    if (this.mode === 'login') {
      promise = SB.signIn(email, password);
    } else {
      // ثبت‌نام: بعد از ساخت حساب، خودکار وارد می‌شه
      promise = SB.signUp(email, password).then(function(data) {
        // اگه سشن نداشت (چون تأیید ایمیل لازمه)، خودکار ورود کن
        if (!data || !data.access_token) {
          return SB.signIn(email, password);
        }
        return data;
      });
    }

    promise.then(function(data) {
      self.loading = false;
      return self._ensureProfile(data.user);
    }).then(function() {
      self.success = self.mode === 'login'
        ? '✅ خوش آمدی!'
        : '✅ ثبت‌نام موفق! خوش آمدی!';
      if (typeof playSnd === 'function') playSnd('success');
      self.refresh();

      setTimeout(function() {
        if (typeof ROUTER !== 'undefined') ROUTER.go('home');
      }, 1500);
    }).catch(function(err) {
      self.loading = false;
      self.error = self._translateError(err.message || 'خطا در ارتباط');
      if (typeof playSnd === 'function') playSnd('error');
      self.refresh();
    });
  },

  // ============ ترجمهٔ خطاها ============
  _translateError: function(msg) {
    if (!msg) return 'خطای ناشناخته';
    var m = msg.toLowerCase();
    if (m.indexOf('invalid login') >= 0) return 'ایمیل یا رمز عبور اشتباهه';
    if (m.indexOf('already registered') >= 0) return 'این ایمیل قبلاً ثبت شده';
    if (m.indexOf('user already') >= 0) return 'این ایمیل قبلاً ثبت شده';
    if (m.indexOf('password') >= 0 && m.indexOf('short') >= 0) return 'رمز عبور کوتاهه';
    if (m.indexOf('email') >= 0 && m.indexOf('invalid') >= 0) return 'ایمیل معتبر نیست';
    if (m.indexOf('network') >= 0) return 'اتصال اینترنت مشکل داره';
    if (m.indexOf('rate') >= 0) return 'زیادی تلاش کردی، چند دقیقه صبر کن';
    return msg;
  },

  // ============ ساخت/خواندن پروفایل ============
  _ensureProfile: function(user) {
    if (!user) return Promise.resolve();

    return SB._request('/rest/v1/users?select=*&auth_id=eq.' + user.id + '&limit=1', {
      method: 'GET'
    }).then(function(res) {
      if (res.ok && res.data && res.data.length > 0) {
        var profile = res.data[0];
        if (typeof STATE !== 'undefined') {
          var stateUser = STATE.getUser() || {};
          stateUser.sbId = profile.id;
          stateUser.sbAuthId = profile.auth_id;
          stateUser.email = user.email;
          stateUser.name = stateUser.name || profile.name || '';
          stateUser.coins = profile.coins || stateUser.coins || 100;
          stateUser.gems = profile.gems || stateUser.gems || 0;
          stateUser.level = profile.level || 1;
          stateUser.streak = profile.streak || 0;
          stateUser.syncedAt = Date.now();
          STATE.setUser(stateUser);
        }
        return profile;
      }

      // پروفایل نیست — بساز
      var stateUser = (typeof STATE !== 'undefined' && STATE.getUser) ? STATE.getUser() : {};
      var newProfile = {
        auth_id: user.id,
        name: stateUser.name || (user.email ? user.email.split('@')[0] : 'کاربر'),
        bio: stateUser.bio || '',
        avatar: stateUser.avatar || 'male',
        avatar_image: stateUser.avatarImage || '',
        selected_tick: stateUser.selectedTick || 'star_black',
        owned_ticks: stateUser.ownedTicks || ['star_black'],
        owned_symbols: stateUser.ownedSymbols || ['sym_moon'],
        owned_themes: stateUser.ownedThemes || ['theme_purple'],
        active_symbol: stateUser.activeSymbol || 'sym_moon',
        active_theme: stateUser.activeTheme || 'theme_purple',
        coins: stateUser.coins || 100,
        gems: stateUser.gems || 0,
        xp: stateUser.xp || 0,
        level: stateUser.level || 1,
        streak: stateUser.streak || 0
      };

      return SB._request('/rest/v1/users', {
        method: 'POST',
        body: newProfile,
        headers: { 'Prefer': 'return=representation' }
      }).then(function(res2) {
        if (res2.ok && res2.data && res2.data.length > 0) {
          var p = res2.data[0];
          if (typeof STATE !== 'undefined') {
            var su = STATE.getUser() || {};
            su.sbId = p.id;
            su.sbAuthId = p.auth_id;
            su.email = user.email;
            su.syncedAt = Date.now();
            STATE.setUser(su);
          }
          return p;
        }
        return null;
      });
    }).catch(function(err) {
      console.warn('Ensure profile error:', err);
      return null;
    });
  },

  // ============ خروج ============
  logout: function() {
    if (!confirm('از حساب خارج بشی؟')) return;
    var self = this;
    SB.signOut().then(function() {
      if (typeof STATE !== 'undefined') {
        var u = STATE.getUser() || {};
        delete u.sbId;
        delete u.sbAuthId;
        delete u.email;
        delete u.syncedAt;
        STATE.setUser(u);
      }
      if (typeof showToast === 'function') showToast('👋 خارج شدی');
      if (typeof APP !== 'undefined' && APP.renderHome) APP.renderHome();
      if (typeof playSnd === 'function') playSnd('tap');
      self.refresh();
    });
  },

  // ============ ادامه بدون ورود ============
  continueAsGuest: function() {
    if (typeof playSnd === 'function') playSnd('tap');
    if (typeof ROUTER !== 'undefined') ROUTER.go('home');
  },

  // ============ بازگشت ============
  back: function() {
    if (typeof playSnd === 'function') playSnd('tap');
    if (typeof ROUTER !== 'undefined') ROUTER.go('profile');
  },

  // ============ رندر ============
  render: function() {
    var html = '<div class="auth-page">';

    html += '<div class="auth-topbar">';
    html += '<button class="auth-back" onclick="AUTH.back()">›</button>';
    html += '<div class="auth-title">🔐 حساب کاربری</div>';
    html += '</div>';

    // اگه کاربر لاگین هست، کارت وضعیت نشون بده
    if (typeof SB !== 'undefined' && SB.isLoggedIn && SB.isLoggedIn()) {
      html += this.renderStatusCard();
      html += '</div>';
      return html;
    }

    // لوگو
    html += '<div class="auth-logo">';
    html += '<div class="auth-logo-icon">⭐</div>';
    html += '<div class="auth-logo-name">ستاره</div>';
    html += '<div class="auth-logo-sub">بازی کن، بساز، بدرخش</div>';
    html += '</div>';

    // تب‌ها
    html += '<div class="auth-tabs">';
    html += '<button class="auth-tab ' + (this.mode === 'login' ? 'active' : '') + '" onclick="AUTH.setMode(\'login\')">🔑 ورود</button>';
    html += '<button class="auth-tab ' + (this.mode === 'signup' ? 'active' : '') + '" onclick="AUTH.setMode(\'signup\')">✨ ثبت‌نام</button>';
    html += '</div>';

    if (this.error) {
      html += '<div class="auth-error">⚠️ ' + this.error + '</div>';
    }

    if (this.success) {
      html += '<div class="auth-success">' + this.success + '</div>';
    }

    // فرم
    html += '<div class="auth-form">';

    html += '<div class="auth-field">';
    html += '<label class="auth-field-label">📧 ایمیل</label>';
    html += '<input type="email" class="auth-input" id="authEmail" placeholder="example@mail.com" autocomplete="email">';
    html += '</div>';

    html += '<div class="auth-field">';
    html += '<label class="auth-field-label">🔒 رمز عبور</label>';
    html += '<input type="password" class="auth-input" id="authPassword" placeholder="حداقل ۶ کاراکتر" autocomplete="' + (this.mode === 'login' ? 'current-password' : 'new-password') + '" onkeydown="if(event.key===\'Enter\')AUTH.submit()">';
    html += '</div>';

    var btnText = this.mode === 'login' ? 'ورود به حساب' : 'ثبت‌نام';
    var btnIcon = this.mode === 'login' ? '🔑' : '✨';
    html += '<button class="auth-submit ' + (this.loading ? 'loading' : '') + '" onclick="AUTH.submit()" ' + (this.loading ? 'disabled' : '') + '>';
    html += btnIcon + ' ' + btnText;
    html += '</button>';

    html += '</div>';

    html += '<button class="auth-guest" onclick="AUTH.continueAsGuest()">👤 بدون ثبت‌نام ادامه بده</button>';

    html += '<div class="auth-note">';
    html += '<span class="icon">💡</span>';
    html += '<span>اگه وارد بشی، سکه‌ها، جم و آمارت روی سرور ذخیره می‌شه و روی هر گوشی می‌تونی استفاده کنی.</span>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  // ============ کارت وضعیت (توی پروفایل و صفحهٔ auth) ============
  renderStatusCard: function() {
    var isLoggedIn = (typeof SB !== 'undefined' && SB.isLoggedIn) ? SB.isLoggedIn() : false;
    var user = (typeof SB !== 'undefined' && SB.getUser) ? SB.getUser() : null;
    var stateUser = (typeof STATE !== 'undefined' && STATE.getUser) ? STATE.getUser() : {};
    var email = user && user.email ? user.email : (stateUser.email || '');

    var html = '<div class="auth-status-card">';
    if (isLoggedIn) {
      html += '<div class="auth-status-icon">✅</div>';
      html += '<div class="auth-status-info">';
      html += '<div class="auth-status-title">وارد شدی</div>';
      html += '<div class="auth-status-sub">' + (email || 'کاربر ستاره') + '</div>';
      html += '</div>';
    } else {
      html += '<div class="auth-status-icon guest">👤</div>';
      html += '<div class="auth-status-info">';
      html += '<div class="auth-status-title">مهمان</div>';
      html += '<div class="auth-status-sub">وارد نشدی — داده‌ها فقط روی این گوشی</div>';
      html += '</div>';
    }
    html += '</div>';

    // دکمه
    if (isLoggedIn) {
      html += '<button class="auth-logout-btn" onclick="AUTH.logout()">🚪 خروج از حساب</button>';
    } else {
      html += '<button class="auth-submit" onclick="ROUTER.go(\'auth\')" style="width:100%">🔐 ورود / ثبت‌نام</button>';
    }

    return html;
  },

  // ============ بروزرسانی ============
  refresh: function() {
    var c = document.getElementById('authContent');
    if (c) {
      c.innerHTML = this.render();
      setTimeout(function() {
        var e = document.getElementById('authEmail');
        if (e && !AUTH.loading) e.focus();
      }, 100);
    }
  }
};

window.AUTH = AUTH;
