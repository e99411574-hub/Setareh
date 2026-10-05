// ===== js/settings.js — تنظیمات ستاره =====

var SETTINGS = {

  _customMode: false,

  init: function() {
    // اطمینان از وجود تنظیمات پیش‌فرض
    var s = STATE.get('settings') || {};
    if (!s.lang) s.lang = 'fa';
    if (!s.theme) s.theme = 'theme_purple';
    if (s.sound === undefined) s.sound = true;
    if (!s.customTheme) s.customTheme = null;
    STATE.set('settings', s);
  },

  render: function() {
    var s = STATE.get('settings') || {};
    var lang = s.lang || 'fa';
    var sound = s.sound !== false;
    var theme = s.theme || 'theme_purple';

    var html = '<div class="settings-page">';

    // ============ زبان ============
    html += '<div class="settings-section">';
    html += '<div class="settings-label">🌍 ' + t('language') + '</div>';
    html += '<div class="settings-row">';
    html += '<button class="settings-btn ' + (lang === 'fa' ? 'active' : '') + '" onclick="SETTINGS.setLang(\'fa\')">فارسی</button>';
    html += '<button class="settings-btn ' + (lang === 'en' ? 'active' : '') + '" onclick="SETTINGS.setLang(\'en\')">English</button>';
    html += '</div>';
    html += '</div>';

    // ============ صدا ============
    html += '<div class="settings-section">';
    html += '<div class="settings-row-between" onclick="SETTINGS.toggleSound()">';
    html += '<div class="settings-label" style="margin:0;">🔊 ' + t('sound') + '</div>';
    html += '<div class="toggle-switch ' + (sound ? 'on' : '') + '"><div class="toggle-knob"></div></div>';
    html += '</div>';
    html += '</div>';

    // ============ تم‌ها ============
    html += '<div class="settings-section">';
    html += '<div class="settings-label">🎨 ' + t('theme') + '</div>';
    html += '<div class="theme-grid">';

    var themes = [
      { id: 'theme_purple', name: 'بنفش', color: '#6C5CE7' },
      { id: 'theme_blue',   name: 'آبی',   color: '#0984E3' },
      { id: 'theme_pink',   name: 'صورتی', color: '#E84393' },
      { id: 'theme_green',  name: 'سبز',   color: '#00B894' },
      { id: 'theme_orange', name: 'نارنجی', color: '#E67E22' },
      { id: 'theme_red',    name: 'قرمز',  color: '#E74C3C' },
      { id: 'theme_dark',   name: 'تیره',  color: '#2d3436' },
      { id: 'theme_gold',   name: 'طلایی', color: '#FDCB6E' }
    ];

    for (var i = 0; i < themes.length; i++) {
      var th = themes[i];
      var active = (theme === th.id) ? ' active' : '';
      html += '<div class="theme-item' + active + '" onclick="SETTINGS.setTheme(\'' + th.id + '\')">';
      html += '<div class="theme-swatch" style="background:' + th.color + ';"></div>';
      html += '<div class="theme-name">' + th.name + '</div>';
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';

    // ============ تم سفارشی ============
    html += '<div class="settings-section">';
    html += '<div class="settings-row-between" onclick="SETTINGS.toggleCustom()">';
    html += '<div class="settings-label" style="margin:0;">✨ تم سفارشی</div>';
    html += '<div style="color:#6C5CE7;font-size:20px;">' + (SETTINGS._customMode ? '▲' : '▼') + '</div>';
    html += '</div>';

    if (SETTINGS._customMode) {
      var ct = s.customTheme || { color1: '#6C5CE7', color2: '#0984E3' };
      html += '<div style="margin-top:14px;padding:14px;background:#f8f9fd;border-radius:14px;">';
      html += '<div style="display:flex;gap:12px;margin-bottom:12px;">';
      html += '<label style="flex:1;text-align:center;font-size:12px;">رنگ ۱<input type="color" id="ctColor1" value="' + ct.color1 + '" onchange="SETTINGS.applyCustom()" style="display:block;width:100%;height:40px;border:none;border-radius:8px;margin-top:6px;cursor:pointer;"></label>';
      html += '<label style="flex:1;text-align:center;font-size:12px;">رنگ ۲<input type="color" id="ctColor2" value="' + ct.color2 + '" onchange="SETTINGS.applyCustom()" style="display:block;width:100%;height:40px;border:none;border-radius:8px;margin-top:6px;cursor:pointer;"></label>';
      html += '</div>';
      html += '<button onclick="SETTINGS.saveCustom()" style="width:100%;background:linear-gradient(135deg,#6C5CE7,#0984E3);color:#fff;border:none;padding:12px;border-radius:12px;font-family:inherit;font-weight:bold;font-size:14px;cursor:pointer;">ذخیرهٔ تم سفارشی</button>';
      html += '</div>';
    }
    html += '</div>';

    // ============ دایرهٔ زرد ادمین ============
    if (!AUTH.isLoggedIn()) {
      html += '<div class="settings-section" style="display:flex;justify-content:center;padding:30px 0;">';
      html += '<div onclick="AUTH.showAdminLogin()" style="width:70px;height:70px;border-radius:50%;background:radial-gradient(circle at 30% 30%, #FFE066, #FDCB6E, #E67E22);box-shadow:0 6px 25px rgba(253,203,110,.6), inset 0 0 15px rgba(255,255,255,.5);cursor:pointer;transition:transform .2s ease;" ontouchstart="this.style.transform=\'scale(.92)\'" ontouchend="this.style.transform=\'scale(1)\'"></div>';
      html += '</div>';
    }

    // ============ پاک کردن داده‌ها ============
    html += '<div class="settings-section">';
    html += '<button class="settings-danger" onclick="SETTINGS.clearData()">🗑️ ' + t('clearData') + '</button>';
    html += '</div>';

    html += '<div style="text-align:center;padding:30px 0;color:#b2bec3;font-size:12px;">⭐ ستاره — نسخه ۲.۰</div>';

    html += '</div>';
    return html;
  },

  // ============ زبان ============
  setLang: function(lang) {
    var s = STATE.get('settings') || {};
    s.lang = lang;
    STATE.set('settings', s);
    if (typeof setLanguage === 'function') setLanguage(lang);
    if (typeof playSnd === 'function') playSnd('tap');
    if (typeof APP !== 'undefined' && APP.renderSettings) APP.renderSettings();
  },

  // ============ صدا ============
  toggleSound: function() {
    var s = STATE.get('settings') || {};
    s.sound = s.sound === false ? true : false;
    STATE.set('settings', s);
    if (s.sound && typeof playSnd === 'function') playSnd('click');
    if (typeof APP !== 'undefined' && APP.renderSettings) APP.renderSettings();
  },

  // ============ تم ============
  setTheme: function(themeId) {
    var s = STATE.get('settings') || {};
    s.theme = themeId;
    STATE.set('settings', s);
    document.body.setAttribute('data-theme', themeId);
    if (typeof playSnd === 'function') playSnd('click');
    if (typeof APP !== 'undefined' && APP.renderSettings) APP.renderSettings();
  },

  // ============ تم سفارشی ============
  toggleCustom: function() {
    SETTINGS._customMode = !SETTINGS._customMode;
    if (typeof playSnd === 'function') playSnd('tap');
    if (typeof APP !== 'undefined' && APP.renderSettings) APP.renderSettings();
  },

  applyCustom: function() {
    var c1 = (document.getElementById('ctColor1') || {}).value || '#6C5CE7';
    var c2 = (document.getElementById('ctColor2') || {}).value || '#0984E3';
    document.documentElement.style.setProperty('--custom-1', c1);
    document.documentElement.style.setProperty('--custom-2', c2);
    document.body.style.background = 'linear-gradient(160deg, ' + c1 + '22, ' + c2 + '22)';
    document.body.setAttribute('data-theme', 'theme_custom');
  },

  saveCustom: function() {
    var c1 = (document.getElementById('ctColor1') || {}).value || '#6C5CE7';
    var c2 = (document.getElementById('ctColor2') || {}).value || '#0984E3';
    var s = STATE.get('settings') || {};
    s.customTheme = { color1: c1, color2: c2 };
    s.theme = 'theme_custom';
    STATE.set('settings', s);
    document.body.setAttribute('data-theme', 'theme_custom');
    if (typeof playSnd === 'function') playSnd('success');
    if (typeof showToast === 'function') showToast('✅ تم سفارشی ذخیره شد');
  },

  // ============ پاک کردن داده‌ها ============
  clearData: function() {
    if (!confirm('مطمئنی می‌خوای تمام داده‌ها رو پاک کنی؟ این کار برگشت‌پذیر نیست!')) return;
    if (!confirm('واقعاً مطمئنی؟ همهٔ سکه‌ها، آمار و تنظیمات پاک میشه!')) return;

    try {
      localStorage.clear();
      if (typeof playSnd === 'function') playSnd('success');
      if (typeof showToast === 'function') showToast('🗑️ همهٔ داده‌ها پاک شد');
      setTimeout(function() { location.reload(); }, 1000);
    } catch (e) {
      if (typeof showToast === 'function') showToast('❌ خطا در پاک کردن');
    }
  }
};

// ============ راه‌اندازی خودکار ============
if (typeof window !== 'undefined') {
  window.SETTINGS = SETTINGS;
       }
