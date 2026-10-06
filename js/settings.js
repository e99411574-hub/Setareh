// ===== js/settings.js — تنظیمات شیشه‌ای ستاره =====

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

  back: function() { ROUTER.go('profile'); },

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

  _switch: function(on) {
    return '<div class="ios-switch ' + (on ? 'on' : '') + '"><div class="knob"></div></div>';
  },

  render: function() {
    var s = STATE.get('settings') || {};
    var currentTheme = s.theme || 'theme_purple';
    var soundOn = s.sound !== false;
    var darkOn = s.dark === true;
    var vibrateOn = s.vibrate !== false;
    var lang = s.lang || 'fa';

    var html = '<div class="settings-page">';

    // ========== نوار بالا ==========
    html += '<div class="settings-topbar">';
    html += '<button class="back-btn" onclick="SETTINGS.back()">‹</button>';
    html += '<div class="settings-title">⚙️ تنظیمات</div>';
    html += '</div>';

    // ========== کارت زبان ==========
    html += '<div class="glass-card">';
    html += '<div class="glass-title"><span class="emoji">🌍</span>زبان</div>';
    html += '<div class="lang-segmented">';
    html += '<button class="lang-seg-btn ' + (lang === 'fa' ? 'active' : '') + '" onclick="SETTINGS.setLang(\'fa\')">فارسی</button>';
    html += '<button class="lang-seg-btn ' + (lang === 'en' ? 'active' : '') + '" onclick="SETTINGS.setLang(\'en\')">English</button>';
    html += '</div>';
    html += '</div>';

    // ========== کارت تنظیمات عمومی ==========
    html += '<div class="glass-card">';
    html += '<div class="glass-title"><span class="emoji">🎛</span>تنظیمات</div>';

    // حالت شب
    html += '<div class="glass-row" onclick="SETTINGS.toggleDark()">';
    html += '<div class="glass-icon">🌙</div>';
    html += '<div class="glass-label">حالت شب<div class="glass-sub">تیره شدن کل اپ</div></div>';
    html += this._switch(darkOn);
    html += '</div>';

    // صدا
    html += '<div class="glass-row" onclick="SETTINGS.toggleSound()">';
    html += '<div class="glass-icon">' + (soundOn ? '🔊' : '🔇') + '</div>';
    html += '<div class="glass-label">صدا<div class="glass-sub">افکت‌های صوتی</div></div>';
    html += this._switch(soundOn);
    html += '</div>';

    // لرزش
    html += '<div class="glass-row" onclick="SETTINGS.toggleVibrate()">';
    html += '<div class="glass-icon">📳</div>';
    html += '<div class="glass-label">لرزش<div class="glass-sub">ویبره هنگام لمس</div></div>';
    html += this._switch(vibrateOn);
    html += '</div>';

    html += '</div>';

    // ========== کارت تم‌ها ==========
    html += '<div class="glass-card">';
    html += '<div class="glass-title"><span class="emoji">🎨</span>تم‌ها</div>';
    html += '<div class="theme-shine-grid">';

    for (var i = 0; i < this.themes.length; i++) {
      var th = this.themes[i];
      var active = (currentTheme === th.id);
      html += '<div class="theme-shine' + (active ? ' active' : '') + '" style="background:linear-gradient(135deg,' + th.c1 + ',' + th.c2 + ')" onclick="SETTINGS.applyTheme(\'' + th.id + '\')">';
      html += '<span class="tname">' + th.name + '</span>';
      if (active) html += '<span class="check-badge">✓</span>';
      html += '</div>';
    }

    var custom = STATE.get('settings.customTheme');
    if (custom) {
      var cActive = (currentTheme === 'theme_custom');
      html += '<div class="theme-shine' + (cActive ? ' active' : '') + '" style="background:linear-gradient(135deg,' + custom.bg1 + ',' + custom.bg2 + ')" onclick="SETTINGS.applyCustomExisting()">';
      html += '<span class="tname">سفارشی</span>';
      if (cActive) html += '<span class="check-badge">✓</span>';
      html += '</div>';
    }

    html += '</div>';

    if (!this._customMode) {
      html += '<button class="glass-btn-primary" onclick="SETTINGS.openCustomBuilder()">✨ ساخت تم سفارشی</button>';
    }

    if (this._customMode) {
      html += this._renderBuilder();
    }

    html += '</div>';

    // ========== کارت خطر ==========
    html += '<div class="glass-card">';
    html += '<div class="glass-row danger" onclick="SETTINGS.confirmReset()">';
    html += '<div class="glass-icon">🗑️</div>';
    html += '<div class="glass-label">پاک کردن همهٔ داده‌ها<div class="glass-sub">غیرقابل بازگشت</div></div>';
    html += '<span style="color:#e74c3c;font-size:22px;font-weight:300;">›</span>';
    html += '</div>';
    html += '</div>';

    // ========== درباره ==========
    html += '<div class="about-glass">';
    html += '<div class="logo-glass">⭐</div>';
    html += '<div class="app-name">ستاره</div>';
    html += '<div class="version">نسخه ۲.۰</div>';
    html += '<div class="tagline">بازی کن، بساز، بدرخش ✨</div>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  _renderBuilder: function() {
    var c = this._customColors;
    var html = '<div class="theme-builder-glass">';
    html += '<div id="builderPreview" class="builder-preview-glass" style="background:linear-gradient(135deg,' + c.bg1 + ',' + c.bg2 + ');color:' + c.text + '">';
    html += '<div class="p-title" style="color:' + c.pr + '">⭐ ستاره</div>';
    html += '<div class="p-sub" style="color:' + c.gold + '">بازی کن، بساز، بدرخش</div>';
    html += '</div>';

    html += '<div class="color-row-glass"><span class="lbl">🎨 رنگ اصلی</span><input type="color" value="' + c.bg1 + '" oninput="SETTINGS.updateCustomColor(\'bg1\', this.value)"></div>';
    html += '<div class="color-row-glass"><span class="lbl">🌈 رنگ دوم</span><input type="color" value="' + c.bg2 + '" oninput="SETTINGS.updateCustomColor(\'bg2\', this.value)"></div>';
    html += '<div class="color-row-glass"><span class="lbl">💜 دکمه‌ها</span><input type="color" value="' + c.pr + '" oninput="SETTINGS.updateCustomColor(\'pr\', this.value)"></div>';
    html += '<div class="color-row-glass"><span class="lbl">⭐ تأکیدی</span><input type="color" value="' + c.gold + '" oninput="SETTINGS.updateCustomColor(\'gold\', this.value)"></div>';
    html += '<div class="color-row-glass"><span class="lbl">📝 متن</span><input type="color" value="' + c.text + '" oninput="SETTINGS.updateCustomColor(\'text\', this.value)"></div>';

    html += '<div class="builder-actions-glass">';
    html += '<button class="cancel" onclick="SETTINGS.closeCustomBuilder()">لغو</button>';
    html += '<button class="save" onclick="SETTINGS.saveCustomTheme()">✓ ذخیره</button>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  refresh: function() {
    var c = document.getElementById('settingsContent');
    if (c) {
      c.innerHTML = this.render();
      if (this._customMode) this._updatePreview();
      c.classList.remove('anim-fade-in');
      void c.offsetWidth;
      c.classList.add('anim-fade-in');
    }
  },

  init: function() {
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
