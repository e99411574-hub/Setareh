// ===== settings.js - صفحهٔ تنظیمات ستاره =====

var SETTINGS = {
  _customMode: false,
  _customColors: {
    bg1: '#b8a0e8',
    bg2: '#e8d5f0',
    bg3: '#f0e8f8',
    pr: '#8b5cf6',
    gold: '#FDCB6E',
    text: '#2d1b4e'
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

  // ========== بازگشت ==========
  back: function() {
    ROUTER.go('profile');
  },

  // ========== تغییر زبان ==========
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

  // ========== تغییر صدا ==========
  toggleSound: function() {
    var s = STATE.get('settings.sound');
    s = (s === false) ? true : false;
    STATE.set('settings.sound', s);
    STATE.save('settings');
    if (s && typeof playSnd === 'function') playSnd('click');
    this.refresh();
  },

  // ========== تغییر تم ==========
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

  // ========== تم سفارشی ==========
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
    var title = p.querySelector('.p-title');
    var sub = p.querySelector('.p-sub');
    if (title) title.style.color = c.pr;
    if (sub) sub.style.color = c.gold;
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

  // ========== پاک کردن داده‌ها ==========
  confirmReset: function() {
    var msg = (typeof t === 'function') ? t('confirm_reset') : 'همهٔ داده‌ها پاک شود؟';
    if (confirm(msg)) {
      STATE.reset();
      try { localStorage.removeItem('setareh_settings'); } catch (e) {}
      if (typeof showToast === 'function') showToast('✅ پاک شد');
      setTimeout(function() { location.reload(); }, 800);
    }
  },

  // ========== رندر ==========
  render: function() {
    var s = STATE.get('settings') || {};
    var currentTheme = s.theme || 'theme_purple';
    var soundOn = s.sound !== false;
    var lang = s.lang || 'fa';

    var html = '<div class="settings-page">';

    // نوار بالا
    html += '<div class="settings-topbar">';
    html += '<button class="back-btn" onclick="SETTINGS.back()">›</button>';
    html += '<div class="settings-title">⚙️ ' + t('settings') + '</div>';
    html += '</div>';

    // ========== بخش: عمومی ==========
    html += '<div class="settings-section">';
    html += '<div class="settings-label">🌍 عمومی</div>';

    // زبان
    html += '<div class="settings-item" style="cursor:default">';
    html += '<span class="item-icon">🌍</span>';
    html += '<span class="item-text">' + t('language') + '</span>';
    html += '</div>';
    html += '<div class="lang-picker">';
    html += '<button class="lang-btn ' + (lang === 'fa' ? 'active' : '') + '" onclick="SETTINGS.setLang(\'fa\')">فارسی</button>';
    html += '<button class="lang-btn ' + (lang === 'en' ? 'active' : '') + '" onclick="SETTINGS.setLang(\'en\')">English</button>';
    html += '</div>';

    // صدا
    html += '<div class="settings-item" onclick="SETTINGS.toggleSound()">';
    html += '<span class="item-icon">' + (soundOn ? '🔊' : '🔇') + '</span>';
    html += '<span class="item-text">' + t('sound') + '</span>';
    html += '<div class="switch ' + (soundOn ? 'on' : '') + '"></div>';
    html += '</div>';

    html += '</div>';

    // ========== بخش: تم ==========
    html += '<div class="settings-section">';
    html += '<div class="settings-label">🎨 رنگ و ظاهر</div>';
    html += '<div class="theme-grid">';

    for (var i = 0; i < this.themes.length; i++) {
      var th = this.themes[i];
      var active = (currentTheme === th.id) ? 'active' : '';
      html += '<div class="theme-opt ' + active + '" style="background:linear-gradient(135deg,' + th.c1 + ' 0%,' + th.c2 + ' 100%)" onclick="SETTINGS.applyTheme(\'' + th.id + '\')">';
      html += '<span class="theme-name">' + th.name + '</span>';
      if (active) html += '<span class="check-badge">✓</span>';
      html += '</div>';
    }

    // تم سفارشی ذخیره‌شده
    var custom = STATE.get('settings.customTheme');
    if (custom) {
      var cActive = (currentTheme === 'theme_custom') ? 'active' : '';
      html += '<div class="theme-opt ' + cActive + '" style="background:linear-gradient(135deg,' + custom.bg1 + ' 0%,' + custom.bg2 + ' 100%)" onclick="SETTINGS.applyCustomExisting()">';
      html += '<span class="theme-name">سفارشی</span>';
      if (cActive) html += '<span class="check-badge">✓</span>';
      html += '</div>';
    }

    html += '</div>';

    // دکمه ساخت تم سفارشی
    if (!this._customMode) {
      html += '<button class="custom-theme-btn" onclick="SETTINGS.openCustomBuilder()">';
      html += '🎨 ساخت تم سفارشی';
      html += '</button>';
    }

    // سازندهٔ تم
    if (this._customMode) {
      html += this._renderBuilder();
    }

    html += '</div>';

    // ========== بخش: خطرناک ==========
    html += '<div class="settings-section">';
    html += '<div class="settings-item danger" onclick="SETTINGS.confirmReset()">';
    html += '<span class="item-icon">🗑️</span>';
    html += '<span class="item-text">' + t('reset_all') + '</span>';
    html += '</div>';
    html += '</div>';

    // ========== درباره ==========
    html += '<div class="settings-about">';
    html += '<div class="logo">⭐</div>';
    html += '<div style="font-weight:800;font-size:14px;color:var(--text)">' + t('app_name') + '</div>';
    html += '<div>' + t('version') + ' 2.0</div>';
    html += '<div style="margin-top:6px">بازی کن، بساز، بدرخش ✨</div>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  _renderBuilder: function() {
    var c = this._customColors;
    var html = '<div class="theme-builder">';
    html += '<div class="builder-title">🎨 تم خودت رو بساز</div>';

    // پیش‌نمایش
    html += '<div class="builder-preview" id="builderPreview" style="background:linear-gradient(135deg,' + c.bg1 + ',' + c.bg2 + ');color:' + c.text + '">';
    html += '<div class="p-title" style="color:' + c.pr + '">⭐ ' + t('app_name') + '</div>';
    html += '<div class="p-sub" style="color:' + c.gold + '">بازی کن، بساز، بدرخش</div>';
    html += '</div>';

    // رنگ‌ها
    html += '<div class="builder-row">';
    html += '<span class="builder-label">🎨 رنگ اصلی پس‌زمینه</span>';
    html += '<input type="color" class="color-picker" value="' + c.bg1 + '" oninput="SETTINGS.updateCustomColor(\'bg1\', this.value)">';
    html += '</div>';

    html += '<div class="builder-row">';
    html += '<span class="builder-label">🌈 رنگ دوم پس‌زمینه</span>';
    html += '<input type="color" class="color-picker" value="' + c.bg2 + '" oninput="SETTINGS.updateCustomColor(\'bg2\', this.value)">';
    html += '</div>';

    html += '<div class="builder-row">';
    html += '<span class="builder-label">💜 رنگ اصلی (دکمه‌ها)</span>';
    html += '<input type="color" class="color-picker" value="' + c.pr + '" oninput="SETTINGS.updateCustomColor(\'pr\', this.value)">';
    html += '</div>';

    html += '<div class="builder-row">';
    html += '<span class="builder-label">⭐ رنگ تأکیدی</span>';
    html += '<input type="color" class="color-picker" value="' + c.gold + '" oninput="SETTINGS.updateCustomColor(\'gold\', this.value)">';
    html += '</div>';

    html += '<div class="builder-row">';
    html += '<span class="builder-label">📝 رنگ متن</span>';
    html += '<input type="color" class="color-picker" value="' + c.text + '" oninput="SETTINGS.updateCustomColor(\'text\', this.value)">';
    html += '</div>';

    // دکمه‌ها
    html += '<div class="builder-actions">';
    html += '<button class="builder-cancel" onclick="SETTINGS.closeCustomBuilder()">لغو</button>';
    html += '<button class="builder-save" onclick="SETTINGS.saveCustomTheme()">✓ ذخیره</button>';
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
