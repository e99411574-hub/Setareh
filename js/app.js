// ===== app.js - راه‌اندازی و صفحهٔ اصلی ستاره =====

var APP = {
  version: '2.0.0',
  _poemsCache: null,

  // ============ راه‌اندازی ============
  init: function() {
    if (!STORAGE.isSupported()) {
      alert('مرورگر شما از ذخیره‌سازی پشتیبانی نمی‌کند');
    }

    STATE.init();

    // تست اتصال Supabase (alert برای دیباگ)
    setTimeout(function() {
      var msg = '🔍 وضعیت Supabase:\n';
      msg += 'SB: ' + (typeof SB !== 'undefined' ? '✅' : '❌') + '\n';
      msg += 'supabase (global): ' + (typeof supabase !== 'undefined' ? '✅' : '❌') + '\n';
      msg += 'SB.init: ' + (typeof SB !== 'undefined' && typeof SB.init === 'function' ? '✅' : '❌') + '\n';
      msg += 'SB.testConnection: ' + (typeof SB !== 'undefined' && typeof SB.testConnection === 'function' ? '✅' : '❌');

      if (typeof SB !== 'undefined' && SB.testConnection) {
        SB.testConnection().then(function() {
          alert(msg + '\n\n✅ اتصال موفق!');
        }).catch(function(err) {
          alert(msg + '\n\n⚠️ خطا: ' + (err.message || err));
        });
      } else {
        alert(msg + '\n\n❌ SB تعریف نشده');
      }
    }, 4000);

    var lang = STATE.get('settings.lang') || 'fa';
    if (typeof setLanguage === 'function') setLanguage(lang);

    var theme = STATE.get('settings.theme') || 'theme_purple';
    document.body.setAttribute('data-theme', theme);

    if (typeof SETTINGS !== 'undefined' && SETTINGS.init) SETTINGS.init();
    if (typeof PROFILE !== 'undefined' && PROFILE.init) PROFILE.init();
    if (typeof SHOP !== 'undefined' && SHOP.init) SHOP.init();
    if (typeof WHEEL !== 'undefined' && WHEEL.init) WHEEL.init();
    if (typeof MISSIONS !== 'undefined' && MISSIONS.init) MISSIONS.init();

    if (typeof initAudio === 'function') {
      document.addEventListener('click', function once() {
        initAudio();
        document.removeEventListener('click', once);
      }, { once: true });
    }

    ROUTER.init();
    this.bindNav();
    this.bindMenu();
    this.updateHeader();
    this.setGreeting();

    STATE.on('coins', this.updateHeader.bind(this));
    STATE.on('gems', this.updateHeader.bind(this));
    STATE.on('levelup', function(level) {
      if (typeof showToast === 'function')
        showToast('🎉 سطح جدید: ' + fmtNum(level));
      if (typeof playSnd === 'function') playSnd('success');
    });

    console.log('⭐ ستاره آماده است — نسخه', this.version);
  },

  // ============ ناوبری پایین ============
  bindNav: function() {
    var btns = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        var view = this.getAttribute('data-view');
        if (view) ROUTER.go(view);
      });
    }
  },

  // ============ منوی همبرگر ============
  bindMenu: function() {
    var btn = document.getElementById('menuBtn');
    var menu = document.getElementById('sideMenu');
    var overlay = document.getElementById('menuOverlay');
    if (!btn || !menu) return;

    btn.addEventListener('click', function() {
      menu.classList.add('open');
      if (overlay) overlay.classList.add('open');
      if (typeof playSnd === 'function') playSnd('tap');
    });

    if (overlay) {
      overlay.addEventListener('click', function() {
        menu.classList.remove('open');
        overlay.classList.remove('open');
      });
    }

    var items = menu.querySelectorAll('.menu-item');
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('click', function() {
        menu.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        var go = this.getAttribute('data-go');
        if (go) ROUTER.go(go);
      });
    }
  },

  // ============ هدر ============
  updateHeader: function() {
    var user = STATE.getUser();
    if (!user) return;

    var coinEl = document.getElementById('hdrCoins');
    if (coinEl) coinEl.textContent = fmtNum(user.coins || 0);

    var gemEl = document.getElementById('hdrGems');
    if (gemEl) gemEl.textContent = fmtNum(user.gems || 0);

    var nameEl = document.getElementById('hdrName');
    if (nameEl) nameEl.textContent = user.name || t('guest');
  },

  // ============ سلام روز ============
  setGreeting: function() {
    var h = new Date().getHours();
    var key = 'greet_evening';
    if (h < 5)       key = 'greet_night';
    else if (h < 12) key = 'greet_morning';
    else if (h < 17) key = 'greet_noon';
    else if (h < 20) key = 'greet_evening';
    var el = document.getElementById('greeting');
    if (el) el.textContent = t(key);
  },

  // ============ رندر صفحهٔ خانه ============
  renderHome: function() {
    var c = document.getElementById('homeContent');
    if (!c) return;

    var user = STATE.getUser();
    var html = '<div class="home-page">';

    html += '<div class="welcome-card">';
    html += '<div class="welcome-icon">⭐</div>';
    html += '<div class="welcome-text">';
    html += '<div class="welcome-title">' + t('welcome') + ' ' + (user.name || t('guest')) + '!</div>';
    html += '<div class="welcome-sub">' + t('welcome_sub') + '</div>';
    html += '</div>';
    html += '</div>';

    html += this._renderHomePoem();

    if (typeof WHEEL !== 'undefined' && WHEEL.renderSection) {
      html += WHEEL.renderSection();
    }

    if (typeof MISSIONS !== 'undefined' && MISSIONS.render) {
      html += '<div id="missionsContainer">' + MISSIONS.render() + '</div>';
    }

    html += '</div>';
    c.innerHTML = html;
  },

  _renderHomePoem: function() {
    var poem = this._getPoemOfDay();
    var html = '<div class="poem-card">';
    html += '<div class="poem-header"><span class="icon">📜</span><span class="title">شعر روز</span></div>';
    html += '<div class="poem-poet">' + (poem.poet || '') + '</div>';
    html += '<div class="poem-text">' + (poem.text || '') + '</div>';
    html += '</div>';
    return html;
  },

  _getPoemOfDay: function() {
    var poems = this._poemsCache;
    if (!poems) {
      var self = this;
      fetch('assets/poems.json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.poems && data.poems.length > 0) {
            self._poemsCache = data.poems;
            if (document.getElementById('homeContent') &&
                document.getElementById('homeContent').innerHTML.indexOf('poem-card') >= 0) {
              self.renderHome();
            }
          }
        })
        .catch(function(e) {
          console.warn('Poems load error:', e);
        });

      poems = [
        { poet: 'حافظ', text: 'دوش دیدم که ملائک در میخانه زدند\nگل آدم بسرشتند و به پیمانه زدند' },
        { poet: 'سعدی', text: 'بنی آدم اعضای یک پیکرند\nکه در آفرینش ز یک گوهرند' },
        { poet: 'مولانا', text: 'بشنو این نی چون شکایت می‌کند\nاز جدایی‌ها حکایت می‌کند' },
        { poet: 'فردوسی', text: 'توانا بود هر که دانا بود\nز دانش دل پیر برنا بود' },
        { poet: 'خیام', text: 'این کوزه چو من عاشق زاری بوده است\nدر بند سر زلف نگاری بوده است' }
      ];
    }

    var hours12 = Math.floor(Date.now() / (12 * 60 * 60 * 1000));
    var idx = hours12 % poems.length;
    return poems[idx];
  },

  startGame: function(gameId) {
    if (typeof playSnd === 'function') playSnd('tap');
    var fn = window['startGame_' + gameId];
    if (typeof fn === 'function') fn();
    else if (typeof showToast === 'function') showToast('🎮 ' + t('soon'));
  },

  openTool: function(toolId) {
    if (typeof playSnd === 'function') playSnd('tap');
    var fn = window['openTool_' + toolId];
    if (typeof fn === 'function') fn();
    else if (typeof showToast === 'function') showToast('🧰 ' + t('soon'));
  },

  renderGamesMenu: function() {
    var c = document.getElementById('gamesContent');
    if (!c) return;
    var html = '<div class="section-title" style="margin:10px 0 16px"><span class="icon">🎮</span><span>' + t('games') + '</span></div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
    var games = [
      { id: 'rps',    icon: '✊', label: 'سنگ کاغذ قیچی', color: 'purple' },
      { id: 'guess',  icon: '🔢', label: 'حدس عدد',      color: 'blue' },
      { id: 'ttt',    icon: '❌', label: 'دوز',          color: 'pink' },
      { id: 'memory', icon: '🃏', label: 'حافظه',        color: 'orange' }
    ];
    for (var i = 0; i < games.length; i++) {
      var g = games[i];
      html += '<div class="card press color-' + g.color + '" onclick="APP.startGame(\'' + g.id + '\')" style="text-align:center;padding:22px 12px">';
      html += '<div style="font-size:44px;margin-bottom:8px">' + g.icon + '</div>';
      html += '<div style="font-weight:800;font-size:14px">' + g.label + '</div>';
      html += '</div>';
    }
    html += '</div>';
    c.innerHTML = html;
  },

  renderToolsMenu: function() {
    var c = document.getElementById('toolsContent');
    if (!c) return;
    var html = '<div class="section-title" style="margin:10px 0 16px"><span class="icon">🧰</span><span>' + t('tools') + '</span></div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
    var tools = [
      { id: 'calc',    icon: '🧮', label: 'ماشین‌حساب', color: 'yellow' },
      { id: 'planner', icon: '📅', label: 'برنامه',     color: 'green' },
      { id: 'qa',      icon: '❓', label: 'پرسش',        color: 'purple' }
    ];
    for (var i = 0; i < tools.length; i++) {
      var tl = tools[i];
      html += '<div class="card press color-' + tl.color + '" onclick="APP.openTool(\'' + tl.id + '\')" style="text-align:center;padding:22px 12px">';
      html += '<div style="font-size:44px;margin-bottom:8px">' + tl.icon + '</div>';
      html += '<div style="font-weight:800;font-size:14px">' + tl.label + '</div>';
      html += '</div>';
    }
    html += '</div>';
    c.innerHTML = html;
  },

  renderSettings: function() {
    if (typeof SETTINGS !== 'undefined' && SETTINGS.render) {
      var c = document.getElementById('settingsContent');
      if (c) {
        c.innerHTML = SETTINGS.render();
        if (SETTINGS._customMode) SETTINGS._updatePreview();
      }
    }
  }
};

// ============ اجرای خودکار ============
window.addEventListener('DOMContentLoaded', function() {
  try { APP.init(); } catch (e) { console.error('APP init error:', e); }
});

window.APP = APP;
