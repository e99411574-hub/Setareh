// ===== js/settings.js — تنظیمات ستاره =====

var SETTINGS = {
  _customMode: false,
  _customColors: {
    bg1: '#b8a0e8', bg2: '#e8d5f0', bg3: '#f0e8f8',
    pr: '#8b5cf6', gold: '#FDCB6E', text: '#2d1b4e'
  },

  themes: [
    { id: 'theme_purple', name: 'بنفش',    c1: '#b8a0e8', c2: '#8b5cf6' },
    { id: 'theme_pink',   name: 'صورتی',   c1: '#f0a0c8', c2: '#E84393' },
    { id: 'theme_ocean',  name: 'اقیانوس', c1: '#7dd8e8', c2: '#0984E3' },
    { id: 'theme_mint',   name: 'نعنا',    c1: '#90e0c0', c2: '#00B894' },
    { id: 'theme_gold',   name: 'طلایی',   c1: '#f0c878', c2: '#E17055' },
    { id: 'theme_sunset', name: 'غروب',    c1: '#f0a0b8', c2: '#E84393' },
    { id: 'theme_sky',    name: 'آسمان',   c1: '#90c0f0', c2: '#0984E3' },
    { id: 'theme_dark',   name: 'تیره',    c1: '#2d2045', c2: '#a78bfa' }
  ],

  // استایل حالت شب
  _darkCSS: `
    body[data-dark="true"] { background: linear-gradient(160deg, #1a1230 0%, #0f0820 100%) !important; color: #e8e0f5 !important; }
    body[data-dark="true"] .top-bar { background: #1f1a35 !important; }
    body[data-dark="true"] .nav { background: #1f1a35 !important; }
    body[data-dark="true"] .nav-btn { color: #a89bc0 !important; }
    body[data-dark="true"] .card, body[data-dark="true"] .user-card,
    body[data-dark="true"] .profile-list, body[data-dark="true"] .profile-hero,
    body[data-dark="true"] .profile-quick, body[data-dark="true"] .poem-card,
    body[data-dark="true"] .welcome-card, body[data-dark="true"] .stat-cell,
    body[data-dark="true"] .profile-item, body[data-dark="true"] .settings-card,
    body[data-dark="true"] .chat-tabs, body[data-dark="true"] .chat-msg-other,
    body[data-dark="true"] .menu-item, body[data-dark="true"] .side-menu,
    body[data-dark="true"] .mission-card, body[data-dark="true"] .user-menu-box {
      background: #2a2145 !important; color: #e8e0f5 !important;
    }
    body[data-dark="true"] .hero-name, body[data-dark="true"] .item-text,
    body[data-dark="true"] .user-card-name, body[data-dark="true"] .stat-num,
    body[data-dark="true"] .chat-msg-other, body[data-dark="true"] .menu-name,
    body[data-dark="true"] .sec-title, body[data-dark="true"] .welcome-title {
      color: #e8e0f5 !important;
    }
    body[data-dark="true"] .item-value, body[data-dark="true"] .hero-bio,
    body[data-dark="true"] .user-card-bio, body[data-dark="true"] .stat-lbl,
    body[data-dark="true"] .menu-footer {
      color: #a89bc0 !important;
    }
    body[data-dark="true"] .chat-room { background: #1a1230 !important; }
    body[data-dark="true"] .chat-room-messages { background: #1a1230 !important; }
    body[data-dark="true"] .chat-room-input { background: #2a2145 !important; }
    body[data-dark="true"] .chat-room-input input { background: #1f1a35 !important; color: #e8e0f5 !important; border-color: #3a2e5c !important; }
  `,

  _ensureDarkCSS: function() {
    if (document.getElementById('darkModeStyles')) return;
    var style = document.createElement('style');
    style.id = 'darkModeStyles';
    style.textContent = this._darkCSS;
    document.head.appendChild(style);
  },

  back: function() {
    ROUTER.go('profile');
  },

  setLang: function(lang) {
    STATE.set('settings.lang', lang);
    STATE.save('settings');
    if (typeof setLanguage === 'function') setLanguage(lang);
    if (typeof playSnd === 'function') playSnd('tap');
    this.refresh();
    if (typeof APP !== 'undefined') {
      if (APP.updateHeader) APP.updateHeader();
      if (APP.setGreeting) APP.setGreeting();
      if (APP.renderHome) APP.renderHome();
    }
  },

  toggleSound: function() {
    var s = STATE.get('settings.sound');
    s = (s === false) ? true : false;
    STATE.set('settings.sound', s);
    STATE.save('settings');
    if (s && typeof playSnd === 'function') playSnd('click');
    this.refresh();
  },

  toggleDark: function() {
    var s = STATE.get('settings.dark');
    s = (s === true) ? false : true;
    STATE.set('settings.dark', s);
    STATE.save('settings');
    if (s) {
      document.body.setAttribute('data-dark', 'true');
    } else {
      document.body.removeAttribute('data-dark');
    }
    if (typeof playSnd === 'function') playSnd('click');
    this.refresh();
  },

  toggleVibrate: function() {
    var s = STATE.get('settings.vibrate');
    s = (s === false) ? true : false;
    STATE.set('settings.vibrate', s);
    STATE.save('settings');
    if (s && navigator.vibrate) navigator.vibrate(30);
    if (typeof playSnd === 'function') playSnd('click');
    this.refresh();
  },

  applyTheme: function(themeId) {
    STATE.set('settings.theme', themeId);
    STATE.save('settings');
    document.body.setAttribute('data-theme', themeId);
    document.documentElement.style.cssText = '';
    document.body.style.background = '';
    document.body.style.color = '';
    if (typeof playSnd === 'function') playSnd('click');
    this.refresh();
  },

  openCustomBuilder: function() {
    this._customMode = true;
    var saved = STATE.get('settings.customTheme');
    if (saved) this._customColors = saved;
    if (typeof playSnd === 'function') playSnd('tap');
    this.refresh();
  },

  closeCustomBuilder: function() {
    this._customMode = false;
    this.refresh();
  },

  updateCustomColor: function(field, value) {
    this._customColors[field] = value;
    this._updatePreview();
  },

  _updatePreview: function() {
    var p = document.getElementById('builderPreview');
    if (!p) return;
    var c = this._customColors;
    p.style.background = 'linear-gradient(135deg, ' + c.bg1 + ', ' + c.bg2 + ')';
    p.style.color = c.text;
  },

  saveCustomTheme: function() {
    var c = this._customColors;
    STATE.set('settings.customTheme', c);
    STATE.set('settings.theme', 'theme_custom');
    STATE.save('settings');
    var root = document.documentElement;
    root.style.setProperty('--bg1', c.bg1);
    root.style.setProperty('--bg2', c.bg2);
    root.style.setProperty('--bg3', c.bg3);
    root.style.setProperty('--pr', c.pr);
    root.style.setProperty('--pr2', c.pr);
    root.style.setProperty('--gold', c.gold);
    root.style.setProperty('--text', c.text);
    document.body.setAttribute('data-theme', 'theme_custom');
    document.body.style.background = 'linear-gradient(160deg, ' + c.bg1 + ' 0%, ' + c.bg2 + ' 50%, ' + c.bg3 + ' 100%)';
    this._customMode = false;
    if (typeof playSnd === 'function') playSnd('success');
    if (typeof showToast === 'function') showToast('✅ تم سفارشی ذخیره شد');
    this.refresh();
  },

  applyCustomExisting: function() {
    var c = STATE.get('settings.customTheme');
    if (!c) return;
    this._customColors = c;
    this.saveCustomTheme();
  },

  confirmReset: function() {
    if (confirm('همهٔ داده‌ها پاک شود؟ این کار برگشت‌پذیر نیست!')) {
      STATE.reset();
      try { localStorage.removeItem('setareh_settings'); } catch (e) {}
      if (typeof showToast === 'function') showToast('✅ پاک شد');
      setTimeout(function() { location.reload(); }, 800);
    }
  },

  _toggleSwitch: function(on) {
    return '<div style="width:48px;height:28px;border-radius:14px;background:' + (on ? '#6C5CE7' : '#e0e0e5') + ';position:relative;transition:background .2s;flex-shrink:0;">' +
      '<div style="width:22px;height:22px;border-radius:50%;background:#fff;position:absolute;top:3px;' + (on ? 'left:23px;' : 'left:3px;') + 'transition:left .2s;box-shadow:0 2px 4px rgba(0,0,0,.2);"></div>' +
      '</div>';
  },

  render: function() {
    var s = STATE.get('settings') || {};
    var currentTheme = s.theme || 'theme_purple';
    var soundOn = s.sound !== false;
    var darkOn = s.dark === true;
    var vibrateOn = s.vibrate !== false;
    var lang = s.lang || 'fa';

    var html = '<div style="padding:16px;max-width:600px;margin:0 auto;">';

    // Header
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">';
    html += '<button onclick="SETTINGS.back()" style="width:40px;height:40px;border-radius:50%;border:none;background:rgba(108,92,231,.15);color:#6C5CE7;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:bold;">‹</button>';
    html += '<div style="font-weight:800;font-size:18px;">⚙️ تنظیمات</div>';
    html += '</div>';

    // Card: Language
    html += '<div style="background:#fff;border-radius:18px;padding:16px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.05);">';
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">';
    html += '<span style="font-size:22px;">🌍</span>';
    html += '<span style="font-weight:700;">زبان</span>';
    html += '</div>';
    html += '<div style="display:flex;gap:6px;background:rgba(108,92,231,.1);padding:4px;border-radius:12px;">';
    html += '<button onclick="SETTINGS.setLang(\'fa\')" style="flex:1;padding:10px;border:none;border-radius:10px;font-family:inherit;font-weight:bold;cursor:pointer;font-size:14px;' + (lang==='fa' ? 'background:linear-gradient(135deg,#6C5CE7,#0984E3);color:#fff;' : 'background:transparent;color:#6C5CE7;') + '">فارسی</button>';
    html += '<button onclick="SETTINGS.setLang(\'en\')" style="flex:1;padding:10px;border:none;border-radius:10px;font-family:inherit;font-weight:bold;cursor:pointer;font-size:14px;' + (lang==='en' ? 'background:linear-gradient(135deg,#6C5CE7,#0984E3);color:#fff;' : 'background:transparent;color:#6C5CE7;') + '">English</button>';
    html += '</div>';
    html += '</div>';

    // Card: Toggles
    html += '<div style="background:#fff;border-radius:18px;padding:4px 16px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.05);">';

    // Dark mode
    html += '<div onclick="SETTINGS.toggleDark()" style="display:flex;align-items:center;gap:14px;padding:14px 0;cursor:pointer;border-bottom:1px solid #f0f0f5;">';
    html += '<span style="font-size:22px;">🌙</span>';
    html += '<span style="font-weight:700;flex:1;">حالت شب</span>';
    html += this._toggleSwitch(darkOn);
    html += '</div>';

    // Sound
    html += '<div onclick="SETTINGS.toggleSound()" style="display:flex;align-items:center;gap:14px;padding:14px 0;cursor:pointer;border-bottom:1px solid #f0f0f5;">';
    html += '<span style="font-size:22px;">' + (soundOn ? '🔊' : '🔇') + '</span>';
    html += '<span style="font-weight:700;flex:1;">صدا</span>';
    html += this._toggleSwitch(soundOn);
    html += '</div>';

    // Vibrate
    html += '<div onclick="SETTINGS.toggleVibrate()" style="display:flex;align-items:center;gap:14px;padding:14px 0;cursor:pointer;">';
    html += '<span style="font-size:22px;">📳</span>';
    html += '<span style="font-weight:700;flex:1;">لرزش</span>';
    html += this._toggleSwitch(vibrateOn);
    html += '</div>';

    html += '</div>';

    // Card: Themes
    html += '<div style="background:#fff;border-radius:18px;padding:16px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.05);">';
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">';
    html += '<span style="font-size:22px;">🎨</span>';
    html += '<span style="font-weight:700;">تم‌ها</span>';
    html += '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">';

    for (var i = 0; i < this.themes.length; i++) {
      var th = this.themes[i];
      var active = (currentTheme === th.id);
      html += '<div onclick="SETTINGS.applyTheme(\'' + th.id + '\')" style="cursor:pointer;position:relative;aspect-ratio:1;border-radius:14px;background:linear-gradient(135deg,' + th.c1 + ',' + th.c2 + ');display:flex;align-items:flex-end;justify-content:center;padding:6px;' + (active ? 'box-shadow:0 0 0 3px #FDCB6E;' : '') + '">';
      html += '<span style="font-size:10px;color:#fff;font-weight:bold;text-shadow:0 1px 2px rgba(0,0,0,.4);">' + th.name + '</span>';
      if (active) html += '<span style="position:absolute;top:4px;right:4px;background:#fff;color:#6C5CE7;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;">✓</span>';
      html += '</div>';
    }

    var custom = STATE.get('settings.customTheme');
    if (custom) {
      var cActive = (currentTheme === 'theme_custom');
      html += '<div onclick="SETTINGS.applyCustomExisting()" style="cursor:pointer;position:relative;aspect-ratio:1;border-radius:14px;background:linear-gradient(135deg,' + custom.bg1 + ',' + custom.bg2 + ');display:flex;align-items:flex-end;justify-content:center;padding:6px;' + (cActive ? 'box-shadow:0 0 0 3px #FDCB6E;' : '') + '">';
      html += '<span style="font-size:10px;color:#fff;font-weight:bold;">سفارشی</span>';
      if (cActive) html += '<span style="position:absolute;top:4px;right:4px;background:#fff;color:#6C5CE7;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;">✓</span>';
      html += '</div>';
    }

    html += '</div>';

    if (!this._customMode) {
      html += '<button onclick="SETTINGS.openCustomBuilder()" style="width:100%;margin-top:14px;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#FDCB6E,#E67E22);color:#fff;font-family:inherit;font-weight:bold;font-size:14px;cursor:pointer;">🎨 ساخت تم سفارشی</button>';
    }

    if (this._customMode) {
      html += this._renderBuilder();
    }

    html += '</div>';

    // Card: Reset
    html += '<div style="background:#fff;border-radius:18px;padding:4px 16px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.05);">';
    html += '<div onclick="SETTINGS.confirmReset()" style="display:flex;align-items:center;gap:14px;padding:14px 0;cursor:pointer;">';
    html += '<span style="font-size:22px;">🗑️</span>';
    html += '<span style="font-weight:700;flex:1;color:#e74c3c;">پاک کردن همهٔ داده‌ها</span>';
    html += '<span style="color:#e74c3c;font-size:22px;">›</span>';
    html += '</div>';
    html += '</div>';

    // About
    html += '<div style="text-align:center;padding:24px 0;">';
    html += '<div style="font-size:44px;margin-bottom:8px;">⭐</div>';
    html += '<div style="font-weight:800;font-size:16px;">ستاره</div>';
    html += '<div style="opacity:.5;font-size:12px;margin-top:4px;">نسخه ۲.۰</div>';
    html += '<div style="font-size:12px;opacity:.7;margin-top:8px;">بازی کن، بساز، بدرخش ✨</div>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  _renderBuilder: function() {
    var c = this._customColors;
    var html = '<div style="margin-top:14px;padding:14px;background:#f8f9fd;border-radius:14px;">';
    html += '<div style="font-weight:bold;margin-bottom:10px;color:#6C5CE7;">🎨 تم خودت رو بساز</div>';

    html += '<div id="builderPreview" style="padding:16px;border-radius:12px;margin-bottom:12px;text-align:center;background:linear-gradient(135deg,' + c.bg1 + ',' + c.bg2 + ');color:' + c.text + '">';
    html += '<div style="color:' + c.pr + ';font-weight:bold;">⭐ ستاره</div>';
    html += '<div style="color:' + c.gold + ';font-size:12px;margin-top:4px;">بازی کن، بساز، بدرخش</div>';
    html += '</div>';

    html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;"><span style="flex:1;font-size:13px;">🎨 رنگ اصلی</span><input type="color" value="' + c.bg1 + '" oninput="SETTINGS.updateCustomColor(\'bg1\', this.value)" style="width:44px;height:32px;border:none;border-radius:8px;cursor:pointer;"></div>';
    html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;"><span style="flex:1;font-size:13px;">🌈 رنگ دوم</span><input type="color" value="' + c.bg2 + '" oninput="SETTINGS.updateCustomColor(\'bg2\', this.value)" style="width:44px;height:32px;border:none;border-radius:8px;cursor:pointer;"></div>';
    html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;"><span style="flex:1;font-size:13px;">💜 دکمه‌ها</span><input type="color" value="' + c.pr + '" oninput="SETTINGS.updateCustomColor(\'pr\', this.value)" style="width:44px;height:32px;border:none;border-radius:8px;cursor:pointer;"></div>';
    html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;"><span style="flex:1;font-size:13px;">⭐ تأکیدی</span><input type="color" value="' + c.gold + '" oninput="SETTINGS.updateCustomColor(\'gold\', this.value)" style="width:44px;height:32px;border:none;border-radius:8px;cursor:pointer;"></div>';
    html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;"><span style="flex:1;font-size:13px;">📝 متن</span><input type="color" value="' + c.text + '" oninput="SETTINGS.updateCustomColor(\'text\', this.value)" style="width:44px;height:32px;border:none;border-radius:8px;cursor:pointer;"></div>';

    html += '<div style="display:flex;gap:8px;margin-top:12px;">';
    html += '<button onclick="SETTINGS.closeCustomBuilder()" style="flex:1;padding:12px;border:none;border-radius:10px;background:#e0e0e5;color:#636e72;font-family:inherit;font-weight:bold;cursor:pointer;">لغو</button>';
    html += '<button onclick="SETTINGS.saveCustomTheme()" style="flex:2;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#6C5CE7,#0984E3);color:#fff;font-family:inherit;font-weight:bold;cursor:pointer;">✓ ذخیره</button>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  refresh: function() {
    var c = document.getElementById('settingsContent');
    if (c) {
      c.innerHTML = this.render();
      c.classList.remove('anim-fade-in');
      void c.offsetWidth;
      c.classList.add('anim-fade-in');
    }
  },

  init: function() {
    this._ensureDarkCSS();
    if (STATE.get('settings.dark') === true) {
      document.body.setAttribute('data-dark', 'true');
    }
    var custom = STATE.get('settings.customTheme');
    if (custom && STATE.get('settings.theme') === 'theme_custom') {
      var root = document.documentElement;
      root.style.setProperty('--bg1', custom.bg1);
      root.style.setProperty('--bg2', custom.bg2);
      root.style.setProperty('--bg3', custom.bg3);
      root.style.setProperty('--pr', custom.pr);
      root.style.setProperty('--pr2', custom.pr);
      root.style.setProperty('--gold', custom.gold);
      root.style.setProperty('--text', custom.text);
      document.body.style.background = 'linear-gradient(160deg, ' + custom.bg1 + ' 0%, ' + custom.bg2 + ' 50%, ' + custom.bg3 + ' 100%)';
    }
  }
};

window.SETTINGS = SETTINGS;
