// ===== app.js — راه‌اندازی و صفحهٔ اصلی ستاره =====

var APP = {
  version: '2.1.0',
  _poemsCache: null,

  init: function() {
    if (!STORAGE.isSupported()) {
      alert('مرورگر شما از ذخیره‌سازی پشتیبانی نمی‌کند');
    }

    STATE.init();

    setTimeout(function() {
      if (typeof SB !== 'undefined' && SB.testConnection) {
        SB.testConnection().catch(function() {});
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
    STATE.on('pani', this.updateHeader.bind(this));

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

    var paniEl = document.getElementById('hdrPani');
    if (paniEl) paniEl.textContent = fmtNum(user.pani || 0);

    var sbData = STATE.get('sbUserData');
    var nameEl = document.getElementById('hdrName');
    if (nameEl) {
      nameEl.textContent = (sbData && sbData.display_name) || user.name || 'مهمان';
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

  // ============ تاریخ شمسی ============
  _formatFaDate: function() {
    try {
      var d = new Date();
      var faMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
      // تبدیل تقریبی میلادی به شمسی (بدون کتابخانه)
      var gy = d.getFullYear();
      var gm = d.getMonth() + 1;
      var gd = d.getDate();
      var g_d_m = [0,31,59,90,120,151,181,212,243,273,304,334];
      var jy = (gy <= 1600) ? 0 : 979;
      gy -= (gy <= 1600) ? 621 : 1600;
      var gy2 = (gm > 2) ? (gy + 1) : gy;
      var days = (365*gy) + parseInt((gy2+3)/4) - parseInt((gy2+99)/100) + parseInt((gy2+399)/400) - 80 + gd + g_d_m[gm-1];
      jy += 33*parseInt(days/12053);
      days %= 12053;
      jy += 4*parseInt(days/1461);
      days %= 1461;
      if (days > 365) { jy += parseInt((days-1)/365); days = (days-1)%365; }
      var jm = (days < 186) ? 1 + parseInt(days/31) : 7 + parseInt((days-186)/30);
      var jd = 1 + ((days < 186) ? (days%31) : ((days-186)%30));
      var hh = d.getHours().toString().padStart(2, '0');
      var mm = d.getMinutes().toString().padStart(2, '0');
      var toFa = function(n) { return String(n).replace(/\d/g, function(x) { return ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'][+x]; }); };
      return toFa(jd) + ' ' + faMonths[jm-1] + ' — ساعت ' + toFa(hh) + ':' + toFa(mm);
    } catch(e) { return ''; }
  },

  // ============ صفحهٔ خانه ============
  renderHome: function() {
    var c = document.getElementById('homeContent');
    if (!c) return;

    var user = STATE.getUser();
    var sbData = STATE.get('sbUserData') || {};

    var html = '<div class="home-abd">';

    // ============ نوار بالا ============
    var avatar = '👨';
    if (user.avatar === 'female') avatar = '👩';
    if (user.avatar === 'custom' && user.avatarImage) {
      avatar = '<img src="' + user.avatarImage + '" alt="">';
    }

    html += '<div class="top-bar-abd">';
    html += '<div class="user-profile-mini" onclick="ROUTER.go(\'profile\')">';
    html += '<div class="avatar-mini">' + avatar + '</div>';
    html += '<div class="info">';
    html += '<div class="name">' + this._esc(sbData.display_name || user.name || 'مهمان') + '</div>';
    html += '<div class="date">' + this._formatFaDate() + '</div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="currency-abd">';
    html += '<div class="cur"><span class="cur-icon">💎</span><span class="cur-val">' + fmtNum(user.gems || 0) + '</span></div>';
    html += '<div class="cur"><span class="cur-icon pani">P</span><span class="cur-val">' + fmtNum(user.pani || 0) + '</span></div>';
    html += '</div>';
    html += '</div>';

    // ============ آنلاین آباد ============
    html += '<div class="abad-card">';
    html += '<div class="abad-title">';
    html += '<div class="left"><span class="icon">🎮</span>آنلاین آباد ...</div>';
    html += '<span class="info-icon">i</span>';
    html += '</div>';
    html += '<div class="abad-row">';
    var games = [
      { id: 'rps',    icon: '✊',  label: 'سنگ کاغذ',  color: 'pink' },
      { id: 'guess',  icon: '🔢',  label: 'حدس عدد',   color: 'purple' },
      { id: 'ttt',    icon: '❌',  label: 'دوز',       color: 'blue' },
      { id: 'memory', icon: '🃏',  label: 'حافظه',     color: 'green' },
      { id: 'guess',  icon: '🎯',  label: 'هدف',       color: 'yellow' },
      { id: 'rps',    icon: '⚡',  label: 'سرعت',      color: 'orange' }
    ];
    games.forEach(function(g) {
      html += '<div class="abad-tile c-' + g.color + '" onclick="APP.startGame(\'' + g.id + '\')">';
      html += '<div class="t-icon">' + g.icon + '</div>';
      html += '<div class="t-label">' + g.label + '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    // ============ حرف آباد (شعر) ============
    var poem = this._getPoemOfDay();
    html += '<div class="abad-card harf-card">';
    html += '<div class="abad-title" style="padding:14px 14px 0;">';
    html += '<div class="left"><span class="icon">🌿</span>حرف آباد ...</div>';
    html += '<div class="harf-badge">۲</div>';
    html += '</div>';
    html += '<div class="harf-inner">';
    html += '<div class="harf-image"><span class="plant">💐</span></div>';
    html += '<div class="harf-content">';
    html += '<div class="harf-poem">' + this._esc(poem.text || '') + '</div>';
    html += '<div class="harf-poet">' + this._esc(poem.poet || '') + '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // ============ ماموریت آباد ============
    if (typeof MISSIONS !== 'undefined' && MISSIONS.renderHome) {
      html += MISSIONS.renderHome();
    }

    // ============ شانس آباد ============
    html += '<div class="abad-card">';
    html += '<div class="abad-title">';
    html += '<div class="left"><span class="icon">🎡</span>شانس آباد ...</div>';
    html += '</div>';
    html += '<div class="abad-row">';
    html += '<div class="chance-tile c-wheel" onclick="if(typeof WHEEL!==\'undefined\'&&WHEEL.open)WHEEL.open()">';
    html += '<div class="ch-icon">🎡</div>';
    html += '<div class="ch-title">گردونه</div>';
    html += '<div class="ch-sub">۱۰۰ تا ۵۰۰ الماس<br>۱۰ تا ۱۰۰ پانی</div>';
    html += '</div>';
    html += '<div class="chance-tile c-lottery" onclick="APP.openLottery()">';
    html += '<div class="ch-icon">🎟️</div>';
    html += '<div class="ch-title">قرعه‌کشی</div>';
    html += '<div class="ch-sub">۵۰۰ الماس ورودی<br>جایزه: ۵۰۰۰ الماس</div>';
    html += '</div>';
    html += '<div class="chance-tile c-gift" onclick="ROUTER.go(\'shop\')">';
    html += '<div class="ch-icon">🎁</div>';
    html += '<div class="ch-title">جعبه</div>';
    html += '<div class="ch-sub">جایزهٔ روزانه</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // ============ کاربران ============
    html += '<div class="abad-card">';
    html += '<div class="abad-title">';
    html += '<div class="left"><span class="icon">👥</span>امتیاز آباد ...</div>';
    html += '</div>';
    html += '<div class="users-row" id="homeUsersRow">';
    html += '<div style="text-align:center;padding:20px;color:#b8a8d8;font-size:12px;width:100%;">در حال بارگذاری...</div>';
    html += '</div></div>';

    html += '</div>';
    c.innerHTML = html;

    this._loadHomeUsers();
  },

  _esc: function(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, function(c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  },

  // ============ لود کاربران ============
  _loadHomeUsers: async function() {
    var box = document.getElementById('homeUsersRow');
    if (!box) return;
    if (typeof SB === 'undefined' || !SB.isLoggedIn || !SB.isLoggedIn()) return;

    try {
      var me = SB.getUser();
      if (!me) return;

      var res = await SB.from('users').select('*');
      var users = (res.data || []).filter(function(u) { return u.id !== me.id; });

      // مرتب‌سازی بر اساس coins (میتونی به gems تغییر بدی)
      users.sort(function(a, b) { return (b.coins || 0) - (a.coins || 0); });

      if (!users.length) {
        box.innerHTML = '<div style="text-align:center;padding:20px;color:#b8a8d8;font-size:12px;width:100%;">هنوز کاربری نیست</div>';
        return;
      }

      var html = '';
      users.slice(0, 30).forEach(function(u, idx) {
        var name = (u.display_name || 'کاربر').substring(0, 12);
        var av = u.avatar === 'female' ? '👩' : '👨';
        var rank = idx + 1;
        var isOnline = u.last_seen && (Date.now() - new Date(u.last_seen).getTime()) < 90000;

        html += '<div class="user-badge" onclick="APP.openUserFromHome(\'' + u.id + '\')">';
        html += '<div class="ub-avatar">' + av;
        if (rank <= 3) html += '<div class="ub-rank">' + rank + '</div>';
        if (isOnline) html += '<div class="ub-online"></div>';
        html += '</div>';
        html += '<div class="ub-name">' + APP._esc(name) + '</div>';
        html += '<div class="ub-val">🪙 ' + fmtNum(u.coins || 0) + '</div>';
        html += '</div>';
      });
      box.innerHTML = html;
    } catch (e) {
      console.warn('home users load error:', e);
      box.innerHTML = '<div style="text-align:center;padding:20px;color:#b8a8d8;font-size:12px;width:100%;">خطا در بارگذاری</div>';
    }
  },

  // ============ باز کردن پروفایل کاربر از خانه ============
  openUserFromHome: function(userId) {
    if (typeof CHAT === 'undefined' || !CHAT.openRoom) {
      ROUTER.go('chat');
      return;
    }
    // اگه دوست بود، چت باز کن، وگرنه برو به چت
    ROUTER.go('chat');
    setTimeout(function() {
      // CHAT.openRoom خودش چک می‌کنه
    }, 300);
  },

  // ============ قرعه‌کشی ============
  openLottery: function() {
    var user = STATE.getUser();
    var now = Date.now();
    var lottery = STATE.get('lottery') || { lastDraw: 0, entries: [], winner: null };

    // ۱۲ ساعت ریست
    var TWELVE_HOURS = 12 * 60 * 60 * 1000;
    if (now - lottery.lastDraw > TWELVE_HOURS) {
      lottery = { lastDraw: now, entries: [], winner: null };
      STATE.set('lottery', lottery);
    }

    var me = SB.getUser();
    var myId = me ? me.id : null;
    var isRegistered = myId && lottery.entries.indexOf(myId) >= 0;

    var overlay = document.createElement('div');
    overlay.className = 'user-menu-popup';
    overlay.id = 'lotteryPopup';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    var body = '';
    body += '<div style="text-align:center;padding:14px;font-weight:900;color:#E67E22;font-size:16px;">🎟️ قرعه‌کشی</div>';
    body += '<div style="text-align:center;padding:0 14px 12px;font-size:12px;color:#636e72;">هر ۱۲ ساعت برگزار میشه</div>';
    body += '<div style="text-align:center;padding:12px;background:#fff8e1;border-radius:14px;margin:0 14px 14px;">';
    body += '<div style="font-size:13px;font-weight:800;color:#E67E22;">💰 ورودی: ۵۰۰ الماس</div>';
    body += '<div style="font-size:13px;font-weight:800;color:#00b894;margin-top:6px;">🏆 جایزه: ۵۰۰۰ الماس</div>';
    body += '</div>';

    if (isRegistered) {
      body += '<div style="text-align:center;padding:14px;color:#00b894;font-weight:800;">✅ ثبت‌نام کردی</div>';
    } else {
      body += '<div class="user-menu-item" onclick="APP.joinLottery()" style="background:linear-gradient(135deg,#FDCB6E,#E67E22);color:#fff;font-weight:900;justify-content:center;margin:0 14px 8px;border-radius:12px;"><span>🎯 شرکت در قرعه‌کشی</span></div>';
    }

    body += '<div style="text-align:center;padding:8px 14px;font-size:11px;color:#636e72;">👥 شرکت‌کننده‌ها: ' + lottery.entries.length + ' نفر</div>';

    if (lottery.winner) {
      body += '<div style="text-align:center;padding:12px;font-weight:800;color:#E67E22;">🏆 برندهٔ قبلی: ' + APP._esc(lottery.winner) + '</div>';
    }

    body += '<div class="user-menu-item user-menu-cancel" onclick="document.getElementById(\'lotteryPopup\').remove()"><span>بستن</span></div>';

    overlay.innerHTML = '<div class="user-menu-box">' + body + '</div>';
    document.body.appendChild(overlay);
  },

  joinLottery: async function() {
    var user = STATE.getUser();
    if ((user.gems || 0) < 500) {
      if (typeof showToast === 'function') showToast('❌ الماس کافی نداری');
      return;
    }
    var me = SB.getUser();
    if (!me) return;

    user.gems = (user.gems || 0) - 500;
    STATE.saveUser(user);
    if (typeof APP !== 'undefined' && APP.updateHeader) APP.updateHeader();

    var lottery = STATE.get('lottery') || { lastDraw: Date.now(), entries: [], winner: null };
    if (lottery.entries.indexOf(me.id) < 0) lottery.entries.push(me.id);
    STATE.set('lottery', lottery);

    if (typeof showToast === 'function') showToast('🎟️ شرکت کردی!');
    if (typeof playSnd === 'function') playSnd('success');
    var pop = document.getElementById('lotteryPopup');
    if (pop) pop.remove();
    APP.openLottery();
  },

  // ============ شعر روز ============
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
        .catch(function(e) {});

      poems = [
        { poet: 'سعدی', text: 'مرا عهدی است با جانان که تا جان در بدن دارم / هواداران کویش را چو جان خویشتن دارم' },
        { poet: 'حافظ', text: 'گل آن باشد که در باغ آید و بی‌رنجِ خار آید' },
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
    else if (typeof showToast === 'function') showToast('🚧 به‌زودی');
  },

  openTool: function(toolId) {
    if (typeof playSnd === 'function') playSnd('tap');
    var fn = window['openTool_' + toolId];
    if (typeof fn === 'function') fn();
    else if (typeof showToast === 'function') showToast('🚧 به‌زودی');
  },

  renderGamesMenu: function() {
    var c = document.getElementById('gamesContent');
    if (!c) return;

    var html = '<div class="section-title" style="margin:10px 0 16px"><span class="icon">🎮</span><span>بازی‌ها</span></div>';
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

    var html = '<div class="section-title" style="margin:10px 0 16px"><span class="icon">🧰</span><span>ابزارها</span></div>';
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
