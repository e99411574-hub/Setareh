// ===== js/profile.js — صفحهٔ پروفایل =====

var PROFILE = {
  _avatarMode: false,
  _tickMode: false,
  _nameMode: false,
  _bioMode: false,
  _usernameMode: false,

  // ============ رفتن به تنظیمات ============
  goSettings: function() {
    ROUTER.go('settings');
  },

  // ============ ویرایش نام ============
  editName: function() {
    this._nameMode = true;
    this._bioMode = false;
    this._usernameMode = false;
    this.refresh();
    setTimeout(function() {
      var i = document.getElementById('pNameInput');
      if (i) i.focus();
    }, 100);
  },

  cancelName: function() {
    this._nameMode = false;
    this.refresh();
  },

  saveName: function() {
    var input = document.getElementById('pNameInput');
    if (!input) return;
    var name = input.value.trim();
    if (!name) {
      if (typeof playSnd === 'function') playSnd('error');
      if (typeof showToast === 'function') showToast('❌ ' + t('nameEmpty'));
      return;
    }
    var u = SHOP.getUser();
    u.name = name;
    SHOP.saveUser(u);
    this._nameMode = false;
    this.refresh();
    if (typeof playSnd === 'function') playSnd('success');
    if (typeof showToast === 'function') showToast('✅ ' + t('nameSaved'));
    if (typeof APP !== 'undefined' && APP.updateHeader) APP.updateHeader();
  },

  // ============ ویرایش بیو ============
  editBio: function() {
    this._bioMode = true;
    this._nameMode = false;
    this._usernameMode = false;
    this.refresh();
    setTimeout(function() {
      var i = document.getElementById('pBioInput');
      if (i) i.focus();
    }, 100);
  },

  cancelBio: function() {
    this._bioMode = false;
    this.refresh();
  },

  saveBio: function() {
    var input = document.getElementById('pBioInput');
    if (!input) return;
    var bio = input.value.trim();
    if (bio.length > 150) bio = bio.substring(0, 150);
    var u = SHOP.getUser();
    u.bio = bio;
    SHOP.saveUser(u);
    this._bioMode = false;
    this.refresh();
    if (typeof playSnd === 'function') playSnd('success');
    if (typeof showToast === 'function') showToast('✅ ' + t('bioSaved'));
  },

  // ============ ویرایش نام کاربری ============
  editUsername: function() {
    this._usernameMode = true;
    this._nameMode = false;
    this._bioMode = false;
    this.refresh();
    setTimeout(function() {
      var i = document.getElementById('pUsernameInput');
      if (i) i.focus();
    }, 100);
  },

  cancelUsername: function() {
    this._usernameMode = false;
    this.refresh();
  },

  saveUsername: async function() {
    var input = document.getElementById('pUsernameInput');
    if (!input) return;
    var uname = input.value.trim();

    if (!uname) {
      if (typeof playSnd === 'function') playSnd('error');
      if (typeof showToast === 'function') showToast('❌ نام کاربری رو وارد کن');
      return;
    }

    if (typeof showToast === 'function') showToast('⏳ در حال ذخیره...');

    var res = await AUTH.updateUsername(uname);
    if (res.ok) {
      this._usernameMode = false;
      this.refresh();
      if (typeof playSnd === 'function') playSnd('success');
      if (typeof showToast === 'function') showToast('✅ نام کاربری ذخیره شد: @' + res.username);
    } else {
      if (typeof playSnd === 'function') playSnd('error');
      if (typeof showToast === 'function') showToast('❌ ' + res.error);
    }
  },

  // ============ انتخاب آواتار ============
  toggleAvatarMode: function() {
    this._avatarMode = !this._avatarMode;
    this._tickMode = false;
    this._usernameMode = false;
    if (typeof playSnd === 'function') playSnd('tap');
    this.refresh();
  },

  setAvatar: function(type) {
    var u = SHOP.getUser();
    if (type === 'male' || type === 'female') {
      u.avatar = type;
      u.avatarImage = '';
      SHOP.saveUser(u);
      this.refresh();
      if (typeof playSnd === 'function') playSnd('click');
    }
  },

  uploadImage: function(evt) {
    var file = evt.target.files[0];
    if (!file) return;
    if (file.size > 500000) {
      if (typeof playSnd === 'function') playSnd('error');
      if (typeof showToast === 'function') showToast('❌ ' + t('imgTooBig'));
      return;
    }
    var reader = new FileReader();
    var self = this;
    reader.onload = function(e) {
      var u = SHOP.getUser();
      u.avatarImage = e.target.result;
      u.avatar = 'custom';
      SHOP.saveUser(u);
      self.refresh();
      if (typeof playSnd === 'function') playSnd('success');
      if (typeof showToast === 'function') showToast('✅ ' + t('imgSaved'));
    };
    reader.readAsDataURL(file);
  },

  // ============ انتخاب تیک ============
  toggleTickMode: function() {
    this._tickMode = !this._tickMode;
    this._avatarMode = false;
    this._usernameMode = false;
    if (typeof playSnd === 'function') playSnd('tap');
    this.refresh();
  },

  setTick: function(tickId) {
    var u = SHOP.getUser();
    if ((u.ownedTicks || []).indexOf(tickId) < 0) {
      if (typeof playSnd === 'function') playSnd('error');
      if (typeof showToast === 'function') showToast('❌ ' + t('tickNotOwned'));
      return;
    }
    u.selectedTick = tickId;
    SHOP.saveUser(u);
    this.refresh();
    if (typeof playSnd === 'function') playSnd('click');
  },

  // ============ رندر آواتار ============
  renderAvatar: function(u) {
    if (u.avatar === 'custom' && u.avatarImage) {
      return '<img src="' + u.avatarImage + '" alt="avatar">';
    }
    if (u.avatar === 'female') return '👩';
    return '👨';
  },

  // ============ رندر اصلی ============
  render: function() {
    var u = SHOP.getUser();
    var sbUser = (typeof SB !== 'undefined' && SB.getUser) ? SB.getUser() : null;
    var sbData = null;

    // اگه کاربر وارد شده، دادهٔ username و is_admin رو از SB بگیریم
    if (sbUser) {
      // async fetch — ولی برای سرعت، از cached استفاده می‌کنیم
      // اگه قبلاً توی STATE ذخیره شده، ازش استفاده کن
      sbData = STATE.get('sbUserData') || null;
    }

    var username = sbData ? sbData.username : null;
    var isVerified = sbData ? sbData.is_verified : false;
    var isAdmin = sbData ? sbData.is_admin : false;

    var html = '<div class="profile-page">';

    // کارت ورود/ثبت‌نام
    html += '<div id="userStatusCard"></div>';

    // هدر
    html += '<div class="profile-hero">';
    html += '<div class="hero-avatar">' + this.renderAvatar(u) + '</div>';
    html += '<div class="hero-info">';
    html += '<div class="hero-name">' + (u.name || t('noName'));
    if (isVerified) html += ' <span style="color:#FDCB6E;font-size:20px;" title="تأیید شده">✓</span>';
    if (isAdmin) html += ' <span style="font-size:20px;" title="مدیر">👑</span>';
    html += '</div>';

    // نمایش @username
    if (username) {
      html += '<div class="hero-username" style="font-size:13px;color:#6C5CE7;font-weight:600;margin-top:4px;">@' + username + '</div>';
    } else if (sbUser) {
      html += '<div class="hero-username" style="font-size:13px;color:#b2bec3;margin-top:4px;">بدون نام کاربری</div>';
    }

    html += '<div class="hero-bio">' + (u.bio || t('noBio')) + '</div>';
    html += '</div>';
    html += '</div>';

    // دکمه‌های سریع
    html += '<div class="profile-quick">';
    html += '<div class="quick-item" onclick="PROFILE.editName()">';
    html += '<div class="quick-icon">✏️</div>';
    html += '<div class="quick-label">' + t('editName') + '</div>';
    html += '</div>';
    html += '<div class="quick-item" onclick="PROFILE.editBio()">';
    html += '<div class="quick-icon">📝</div>';
    html += '<div class="quick-label">' + t('editBio') + '</div>';
    html += '</div>';
    html += '<div class="quick-item" onclick="PROFILE.toggleAvatarMode()">';
    html += '<div class="quick-icon">🎨</div>';
    html += '<div class="quick-label">' + t('chooseAvatar') + '</div>';
    html += '</div>';
    html += '</div>';

    // فرم نام
    if (this._nameMode) {
      html += '<div class="profile-list"><div class="profile-input-row">';
      html += '<input id="pNameInput" type="text" maxlength="20" placeholder="' + t('namePlaceholder') + '" value="' + (u.name || '') + '">';
      html += '<button class="btn-save" onclick="PROFILE.saveName()">✓</button>';
      html += '<button class="btn-cancel" onclick="PROFILE.cancelName()">✕</button>';
      html += '</div></div>';
    }

    // فرم بیو
    if (this._bioMode) {
      html += '<div class="profile-list"><div class="profile-input-row">';
      html += '<textarea id="pBioInput" maxlength="150" rows="2" placeholder="' + t('bioPlaceholder') + '">' + (u.bio || '') + '</textarea>';
      html += '<button class="btn-save" onclick="PROFILE.saveBio()">✓</button>';
      html += '<button class="btn-cancel" onclick="PROFILE.cancelBio()">✕</button>';
      html += '</div></div>';
    }

    // فرم نام کاربری
    if (this._usernameMode) {
      html += '<div class="profile-list" style="padding:14px;">';
      html += '<div style="font-size:13px;color:#636e72;margin-bottom:8px;">نام کاربری (فقط حرف، عدد و _)</div>';
      html += '<div class="profile-input-row" style="display:flex;gap:8px;align-items:center;">';
      html += '<span style="color:#6C5CE7;font-weight:bold;">@</span>';
      html += '<input id="pUsernameInput" type="text" maxlength="20" placeholder="username" value="' + (username || '') + '" dir="ltr" style="flex:1;">';
      html += '<button class="btn-save" onclick="PROFILE.saveUsername()">✓</button>';
      html += '<button class="btn-cancel" onclick="PROFILE.cancelUsername()">✕</button>';
      html += '</div>';
      html += '</div>';
    }

    // انتخاب آواتار
    if (this._avatarMode) {
      html += '<div class="profile-list"><div class="avatar-picker">';
      html += '<div class="avatar-opt ' + (u.avatar === 'male' ? 'active' : '') + '" onclick="PROFILE.setAvatar(\'male\')">👨</div>';
      html += '<div class="avatar-opt ' + (u.avatar === 'female' ? 'active' : '') + '" onclick="PROFILE.setAvatar(\'female\')">👩</div>';
      html += '<label class="avatar-opt ' + (u.avatar === 'custom' ? 'active' : '') + '">📷';
      html += '<input type="file" accept="image/*" style="display:none" onchange="PROFILE.uploadImage(event)">';
      html += '</label>';
      html += '</div></div>';
    }

    // انتخاب تیک
    if (this._tickMode) {
      html += '<div class="profile-list"><div class="tick-picker">';
      var ticks = u.ownedTicks || ['star_black'];
      for (var i = 0; i < ticks.length; i++) {
        var tid = ticks[i];
        var active = (u.selectedTick === tid) ? ' active' : '';
        html += '<div class="tick-opt' + active + '" onclick="PROFILE.setTick(\'' + tid + '\')">';
        html += (typeof renderTick === 'function') ? renderTick(tid, 40) : '⭐';
        html += '</div>';
      }
      html += '</div></div>';
    }

    // اطلاعات
    html += '<div class="profile-list">';

    // نام کاربری
    if (sbUser) {
      html += '<div class="profile-item" onclick="PROFILE.editUsername()">';
      html += '<span class="item-icon">🆔</span>';
      html += '<span class="item-text">نام کاربری</span>';
      html += '<span class="item-value">' + (username ? '@' + username : 'تنظیم کن') + '</span>';
      html += '<span class="item-chevron">‹</span>';
      html += '</div>';
    }

    html += '<div class="profile-item" onclick="PROFILE.toggleTickMode()">';
    html += '<span class="item-icon">⭐</span>';
    html += '<span class="item-text">' + t('chooseTick') + '</span>';
    html += '<span class="item-value">' + (u.selectedTick || '⭐') + '</span>';
    html += '<span class="item-chevron">‹</span>';
    html += '</div>';
    html += '<div class="profile-item" onclick="ROUTER.go(\'shop\')">';
    html += '<span class="item-icon">🪙</span>';
    html += '<span class="item-text">' + t('coins') + '</span>';
    html += '<span class="item-value">' + fmtNum(u.coins || 0) + '</span>';
    html += '<span class="item-chevron">‹</span>';
    html += '</div>';
    html += '<div class="profile-item" onclick="ROUTER.go(\'shop\')">';
    html += '<span class="item-icon">💎</span>';
    html += '<span class="item-text">' + t('gems') + '</span>';
    html += '<span class="item-value">' + fmtNum(u.gems || 0) + '</span>';
    html += '<span class="item-chevron">‹</span>';
    html += '</div>';
    html += '<div class="profile-item" onclick="PROFILE.goSettings()">';
    html += '<span class="item-icon">⚙️</span>';
    html += '<span class="item-text">' + t('settings') + '</span>';
    html += '<span class="item-chevron">‹</span>';
    html += '</div>';
    html += '</div>';

    // آمار
    html += '<div class="profile-list"><div class="stats-row">';
    html += '<div class="stat-cell"><div class="stat-num">' + fmtNum(u.coins || 0) + '</div><div class="stat-lbl">🪙 ' + t('coins') + '</div></div>';
    html += '<div class="stat-cell"><div class="stat-num">' + fmtNum(u.streak || 0) + '</div><div class="stat-lbl">🔥 ' + t('streak') + '</div></div>';
    html += '<div class="stat-cell"><div class="stat-num">' + fmtNum(u.level || 1) + '</div><div class="stat-lbl">⭐ ' + t('level') + '</div></div>';
    html += '</div></div>';

    html += '</div>';
    return html;
  },

  // ============ لود دادهٔ کاربر از Supabase ============
  loadSbUserData: async function() {
    try {
      var sbUser = (typeof SB !== 'undefined' && SB.getUser) ? SB.getUser() : null;
      if (!sbUser) {
        STATE.set('sbUserData', null);
        return;
      }
      var res = await SB.from('users').select('*').eq('id', sbUser.id);
      var data = res && res.data && res.data[0];
      if (data) {
        STATE.set('sbUserData', data);
      }
    } catch (e) {
      console.warn('loadSbUserData error:', e);
    }
  },

  // ============ رفرش ============
  refresh: async function() {
    // اول داده رو از SB بگیر
    await this.loadSbUserData();

    var c = document.getElementById('profileContent');
    if (c) {
      c.innerHTML = this.render();
      c.classList.remove('anim-fade-in');
      void c.offsetWidth;
      c.classList.add('anim-fade-in');
    }

    // کارت ورود/ثبت‌نام
    if (typeof AUTH !== 'undefined' && AUTH.renderStatusCard) {
      setTimeout(function() { AUTH.renderStatusCard(); }, 50);
    }

    if (typeof APP !== 'undefined' && APP.updateHeader) APP.updateHeader();
  },

  // ============ init ============
  init: async function() {
    var u = SHOP.getUser();
    if (!u.ownedTicks) u.ownedTicks = ['star_black'];
    if (!u.selectedTick) u.selectedTick = 'star_black';
    if (!u.avatar) u.avatar = 'male';
    if (u.gems === undefined) u.gems = 0;
    SHOP.saveUser(u);

    // لود اولیه
    await this.loadSbUserData();
  }
};

// ============ راه‌اندازی خودکار ============
if (typeof window !== 'undefined') {
  window.PROFILE = PROFILE;
  }
