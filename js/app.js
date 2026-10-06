// ===== app.js — راه‌اندازی و صفحهٔ اصلی ستاره =====

var APP = {
  version: '2.0.0',
  _poemsCache: null,

  init: function() {
    if (!STORAGE.isSupported()) {
      alert('مرورگر شما از ذخیره‌سازی پشتیبانی نمی‌کند');
    }

    STATE.init();

    setTimeout(function() {
      var msg = 'SB: ' + (typeof SB !== 'undefined' ? '✅' : '❌') + ' | ';
      msg += 'supabase: ' + (typeof supabase !== 'undefined' ? '✅' : '❌') + ' | ';
      msg += 'testConn: ' + (typeof SB !== 'undefined' && typeof SB.testConnection === 'function' ? '✅' : '❌');

      if (typeof SB !== 'undefined' && SB.testConnection) {
        SB.testConnection().then(function() {
          if (typeof showToast === 'function') showToast(msg + ' | ✅ موفق');
        }).catch(function(err) {
          if (typeof showToast === 'function') showToast(msg + ' | ⚠️ ' + (err.message || ''));
        });
      }
    }, 3000);

    var lang = STATE.get('settings.lang') || 'fa';
    if (typeof setLanguage === 'function') setLanguage(lang);

    var theme = STATE.get('settings.theme') || 'theme_purple';
    document.body.setAttribute('data-theme', theme);

    if (typeof SETTINGS !== 'undefined' && SETTINGS.init) SETTINGS.init();
    if (typeof PROFILE !== 'undefined' && PROFILE.init) PROFILE.init();
    if (typeof SHOP !== 'undefined' && SHOP.init) SHOP.init();
    if (typeof WHEEL !== 'undefined' && WHEEL.init) WHEEL.init();
    if (typeof MISSIONS !== 'undefined' && MISSIONS.init) MISSIONS.init();
    if (typeof AUTH !== 'undefined' && AUTH.init) AUTH.init();
    if (typeof CHAT !== 'undefined' && CHAT.init) CHAT.init();

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

  bindNav: function() {
    var btns = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        var view = this.getAttribute('data-view');
        if (view) ROUTER.go(view);
      });
    }
  },

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

  updateHeader: function() {
    var user = STATE.getUser();
    if (!user) return;

    var coinEl = document.getElementById('hdrCoins');
    if (coinEl) coinEl.textContent = fmtNum(user.coins || 0);

    var gemEl = document.getElementById('hdrGems');
    if (gemEl) gemEl.textContent = fmtNum(user.gems || 0);

    var sbData = STATE.get('sbUserData');
    var nameEl = document.getElementById('hdrName');
    if (nameEl) {
      nameEl.textContent = (sbData && sbData.display_name) || user.name || t('guest');
    }
  },

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

  // ============ صفحهٔ خانه (سبک عسل‌آباد) ============
  renderHome: function() {
    var c = document.getElementById('homeContent');
    if (!c) return;

    var user = STATE.getUser();
    var sbData = STATE.get('sbUserData') || {};

    var html = '<div class="home-abd">';

    // ============ بخش ۱: بازی‌های آنلاین ============
    html += '<div class="abad-card">';
    html += '<div class="abad-title"><div class="left"><span class="icon">🎮</span>بازی‌های آنلاین</div><span class="more">…</span></div>';
    html += '<div class="abad-row">';
    var games = [
      { id: 'rps',    icon: '✊',  label: 'سنگ کاغذ',  color: 'pink' },
      { id: 'guess',  icon: '🔢',  label: 'حدس عدد',   color: 'purple' },
      { id: 'ttt',    icon: '❌',  label: 'دوز',       color: 'blue' },
      { id: 'memory', icon: '🃏',  label: 'حافظه',     color: 'green' },
      { id: 'rps',    icon: '🎯',  label: 'هدف',       color: 'yellow' },
      { id: 'guess',  icon: '⚡',  label: 'سرعت',      color: 'orange' }
    ];
    games.forEach(function(g) {
      html += '<div class="abad-tile c-' + g.color + '" onclick="APP.startGame(\'' + g.id + '\')">';
      html += '<div class="t-icon">' + g.icon + '</div>';
      html += '<div class="t-label">' + g.label + '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    // ============ بخش ۲: چت با دوستان ============
    html += '<div class="abad-card">';
    html += '<div class="abad-title"><div class="left"><span class="icon">💬</span>حرف بزن</div><span class="more">…</span></div>';
    html += '<div class="chat-big" onclick="ROUTER.go(\'chat\')">';
    html += '<div class="cb-icon">💌</div>';
    html += '<div class="cb-info">';
    html += '<div class="cb-title">چت با دوستانت</div>';
    html += '<div class="cb-sub">پیام، عکس و ویس بفرست 🎤</div>';
    html += '</div>';
    html += '<div class="cb-arrow">‹</div>';
    html += '</div>';
    html += '</div>';

    // ============ بخش ۳: ماموریت‌ها ============
    if (typeof MISSIONS !== 'undefined' && MISSIONS.render) {
      var missionsHtml = MISSIONS.render();
      if (missionsHtml) {
        html += '<div class="abad-card">';
        html += '<div class="abad-title"><div class="left"><span class="icon">🎯</span>ماموریت‌های روزانه</div><span class="more">…</span></div>';
        html += '<div class="abad-row" style="gap:8px;">';
        html += missionsHtml;
        html += '</div></div>';
      }
    }

    // ============ بخش ۴: شانس و جایزه ============
    html += '<div class="abad-card">';
    html += '<div class="abad-title"><div class="left"><span class="icon">🎡</span>شانس و جایزه</div><span class="more">…</span></div>';
    html += '<div class="abad-row">';
    html += '<div class="abad-tile c-yellow" onclick="if(typeof WHEEL!==\'undefined\'&&WHEEL.open)WHEEL.open()"><div class="t-icon">🎡</div><div class="t-label">گردونه</div></div>';
    html += '<div class="abad-tile c-pink" onclick="ROUTER.go(\'shop\')"><div class="t-icon">🎁</div><div class="t-label">جعبه</div></div>';
    html += '<div class="abad-tile c-purple" onclick="ROUTER.go(\'shop\')"><div class="t-icon">💎</div><div class="t-label">الماس</div></div>';
    html += '<div class="abad-tile c-orange" onclick="ROUTER.go(\'shop\')"><div class="t-icon">🪙</div><div class="t-label">سکه</div></div>';
    html += '</div></div>';

    // ============ بخش ۵: ابزارها ============
    html += '<div class="abad-card">';
    html += '<div class="abad-title"><div class="left"><span class="icon">🧰</span>ابزارها</div><span class="more">…</span></div>';
    html += '<div class="abad-row">';
    var tools = [
      { id: 'calc',    icon: '🧮', label: 'ماشین‌حساب', color: 'green' },
      { id: 'planner', icon: '📅', label: 'برنامه',     color: 'blue' },
      { id: 'qa',      icon: '❓', label: 'پرسش',       color: 'purple' }
    ];
    tools.forEach(function(tl) {
      html += '<div class="abad-tile c-' + tl.color + '" onclick="APP.openTool(\'' + tl.id + '\')">';
      html += '<div class="t-icon">' + tl.icon + '</div>';
      html += '<div class="t-label">' + tl.label + '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    // ============ بخش ۶: دوستان ============
    html += '<div class="abad-card">';
    html += '<div class="abad-title"><div class="left"><span class="icon">👥</span>دوستانت</div><span class="more">…</span></div>';
    html += '<div class="abad-row" id="homeFriendsRow" style="gap:8px;">';
    html += '<div style="text-align:center;padding:20px;color:#b8a8d8;font-size:12px;">در حال بارگذاری...</div>';
    html += '</div></div>';

    // ============ بخش ۷: شعر روز ============
    html += '<div class="abad-card">';
    html += '<div class="abad-title"><div class="left"><span class="icon">📜</span>شعر روز</div></div>';
    var poem = this._getPoemOfDay();
    html += '<div style="padding:10px 4px;">';
    html += '<div style="font-size:11px;color:#b8a8d8;font-weight:700;margin-bottom:6px;">' + (poem.poet || '') + '</div>';
    html += '<div style="font-size:14px;line-height:1.9;color:#2d1b4e;font-weight:600;">' + (poem.text || '') + '</div>';
    html += '</div></div>';

    html += '</div>';
    c.innerHTML = html;

    this._loadHomeFriends();
  },

  _loadHomeFriends: async function() {
    var box = document.getElementById('homeFriendsRow');
    if (!box) return;
    if (typeof SB === 'undefined' || !SB.isLoggedIn || !SB.isLoggedIn()) return;

    try {
      var me = SB.getUser();
      if (!me) return;

      var res = await SB.from('friendships').select('*').eq('status', 'accepted');
      var all = (res.data || []).filter(function(f) {
        return f.user_id === me.id || f.friend_id === me.id;
      });

      var html = '<div class="abad-tile c-lavender" onclick="ROUTER.go(\'chat\')" style="width:76px;">';
      html += '<div class="t-icon">➕</div>';
      html += '<div class="t-label">افزودن</div>';
      html += '</div>';

      if (all.length) {
        var friendIds = all.slice(0, 8).map(function(f) {
          return f.user_id === me.id ? f.friend_id : f.user_id;
        });

        var uRes = await SB.from('users').select('*');
        var users = (uRes.data || []).filter(function(u) {
          return friendIds.indexOf(u.id) >= 0;
        });

        users.forEach(function(u) {
          var name = (u.display_name || 'کاربر').substring(0, 10);
          var av = u.avatar === 'female' ? '👩' : '👨';
          html += '<div class="user-score" onclick="CHAT.openRoom(\'' + u.id + '\')">';
          html += '<div class="us-avatar">' + av + '</div>';
          html += '<div class="us-name">' + name + '</div>';
          html += '</div>';
        });
      } else {
        html += '<div style="text-align:center;padding:20px;color:#b8a8d8;font-size:12px;">هنوز دوستی نداری</div>';
      }

      box.innerHTML = html;
    } catch (e) {
      console.warn('home friends load error:', e);
    }
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
          }
        })
        .catch(function(e) {
          console.warn('Poems load error:', e);
        });

      poems = [
        { poet: 'حافظ', text: 'گل آن باشد که در باغ آید و بی‌رنجِ خار آید' },
        { poet: 'سعدی', text: 'به راه بادیه رفتن به از نشستن باطل' },
        { poet: 'مولانا', text: 'از جان چه خبر داری کز جان خبرت نبود' },
        { poet: 'فردوسی', text: 'توانا بود هر که دانا بود' },
        { poet: 'خیام', text: 'در دیر مغان آیین کفر و دین نباشد' }
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
    else if (typeof showToast === 'function') showToast('🚧 ' + t('soon'));
  },

  openTool: function(toolId) {
    if (typeof playSnd === 'function') playSnd('tap');
    var fn = window['openTool_' + toolId];
    if (typeof fn === 'function') fn();
    else if (typeof showToast === 'function') showToast('🚧 ' + t('soon'));
  },

  renderGamesMenu: function() {
    var c = document.getElementById('gamesContent');
    if (!c) return;

    var html = '<div class="section-title" style="margin:10px 0 16px"><span class="icon">🎮</span><span>' + t('games') + '</span></div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';

    var games = [
      { id: 'rps',    icon: '✊', label: 'سنگ کاغذ قیچی', color: 'purple' },
      { id: 'guess',  icon: '🔢', label: 'حدس عدد',       color: 'blue' },
      { id: 'ttt',    icon: '❌', label: 'دوز',           color: 'pink' },
      { id: 'memory', icon: '🃏', label: 'حافظه',         color: 'orange' }
    ];

    for (var i = 0; i < games.length; i++) {
      var g = games[i];
      html += '<div class="card press color-' + g.color + '" onclick="APP.startGame(\'' + g.id + '\')" style="text-align:center">';
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
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';

    var tools = [
      { id: 'calc',    icon: '🧮', label: 'ماشین‌حساب', color: 'yellow' },
      { id: 'planner', icon: '📅', label: 'برنامه',     color: 'green' },
      { id: 'qa',      icon: '❓', label: 'پرسش',       color: 'purple' }
    ];

    for (var i = 0; i < tools.length; i++) {
      var tl = tools[i];
      html += '<div class="card press color-' + tl.color + '" onclick="APP.openTool(\'' + tl.id + '\')" style="text-align:center">';
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

// ============ راه‌اندازی خودکار ============
window.addEventListener('DOMContentLoaded', function() {
  try { APP.init(); } catch (e) { console.error('APP init error:', e); }
});
