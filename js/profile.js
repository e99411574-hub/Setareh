// ===== js/profile.js — صفحهٔ پروفایل =====

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}

var PROFILE = {
  _avatarMode: false,
  _tickMode: false,
  _nameMode: false,
  _bioMode: false,

  goSettings: function() { ROUTER.go('settings'); },

  editName: function() {
    this._nameMode = true;
    this._bioMode = false;
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

  editBio: function() {
    this._bioMode = true;
    this._nameMode = false;
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

  toggleAvatarMode: function() {
    this._avatarMode = !this._avatarMode;
    this._tickMode = false;
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

  toggleTickMode: function() {
    this._tickMode = !this._tickMode;
    this._avatarMode = false;
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

  renderAvatar: function(u) {
    if (u.avatar === 'custom' && u.avatarImage) {
      return '<img src="' + u.avatarImage + '" alt="avatar">';
    }
    if (u.avatar === 'female') return '👩';
    return '👨';
  },

  render: function() {
    var u = SHOP.getUser();
    var sbUser = (typeof SB !== 'undefined' && SB.getUser) ? SB.getUser() : null;
    var sbData = STATE.get('sbUserData') || null;

    var username = sbData ? sbData.username : null;
    var isVerified = sbData ? sbData.is_verified : false;
    var isAdmin = sbData ? sbData.is_admin : false;
    var displayName = (sbData && sbData.display_name) || u.name || t('noName');

    var html = '<div class="profile-page">';

    html += '<div id="userStatusCard"></div>';

    html += '<div class="profile-hero">';
    html += '<div class="hero-avatar">' + this.renderAvatar(u) + '</div>';
    html += '<div class="hero-info">';
    html += '<div class="hero-name">' + escapeHtml(displayName);
    if (isVerified) html += ' <span style="color:#FDCB6E;font-size:18px;" title="تأیید شده">✓</span>';
    if (isAdmin) html += ' <span style="font-size:18px;" title="مدیر">👑</span>';
    html += '</div>';

    if (username) {
      html += '<div class="hero-username" dir="ltr" style="font-size:13px;color:#6C5CE7;font-weight:600;margin-top:4px;text-align:center;">@' + escapeHtml(username) + '</div>';
    }

    html += '<div class="hero-bio">' + escapeHtml(u.bio || t('noBio')) + '</div>';
    html += '</div>';
    html += '</div>';

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

    if (this._nameMode) {
      html += '<div class="profile-list"><div class="profile-input-row">';
      html += '<input id="pNameInput" type="text" maxlength="20" placeholder="' + t('namePlaceholder') + '" value="' + escapeHtml(u.name || '') + '">';
      html += '<button class="btn-save" onclick="PROFILE.saveName()">✓</button>';
      html += '<button class="btn-cancel" onclick="PROFILE.cancelName()">✕</button>';
      html += '</div></div>';
    }

    if (this._bioMode) {
      html += '<div class="profile-list"><div class="profile-input-row">';
      html += '<textarea id="pBioInput" maxlength="150" rows="2" placeholder="' + t('bioPlaceholder') + '">' + escapeHtml(u.bio || '') + '</textarea>';
      html += '<button class="btn-save" onclick="PROFILE.saveBio()">✓</button>';
      html += '<button class="btn-cancel" onclick="PROFILE.cancelBio()">✕</button>';
      html += '</div></div>';
    }

    if (this._avatarMode) {
      html += '<div class="profile-list"><div class="avatar-picker">';
      html += '<div class="avatar-opt ' + (u.avatar === 'male' ? 'active' : '') + '" onclick="PROFILE.setAvatar(\'male\')">👨</div>';
      html += '<div class="avatar-opt ' + (u.avatar === 'female' ? 'active' : '') + '" onclick="PROFILE.setAvatar(\'female\')">👩</div>';
      html += '<label class="avatar-opt ' + (u.avatar === 'custom' ? 'active' : '') + '">📷';
      html += '<input type="file" accept="image/*" style="display:none" onchange="PROFILE.uploadImage(event)">';
      html += '</label>';
      html += '</div></div>';
    }

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

    html += '<div class="profile-list">';

    if (sbUser && username) {
      html += '<div class="profile-item" style="opacity:.8;">';
      html += '<span class="item-icon">🆔</span>';
      html += '<span class="item-text">نام کاربری</span>';
      html += '<span class="item-value" dir="ltr" style="display:inline-block;">@' + escapeHtml(username) + '</span>';
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
    html += '<span class="item-text">سکه</span>';
    html += '<span class="item-value">' + fmtNum(u.coins || 0) + '</span>';
    html += '<span class="item-chevron">‹</span>';
    html += '</div>';
    html += '<div class="profile-item" onclick="ROUTER.go(\'shop\')">';
    html += '<span class="item-icon">💎</span>';
    html += '<span class="item-text">الماس</span>';
    html += '<span class="item-value">' + fmtNum(u.gems || 0) + '</span>';
    html += '<span class="item-chevron">‹</span>';
    html += '</div>';
    html += '<div class="profile-item" onclick="PROFILE.goSettings()">';
    html += '<span class="item-icon">⚙️</span>';
    html += '<span class="item-text">' + t('settings') + '</span>';
    html += '<span class="item-chevron">‹</span>';
    html += '</div>';
    html += '</div>';

    html += '<div class="profile-list"><div class="stats-row">';
    html += '<div class="stat-cell"><div class="stat-num">' + fmtNum(u.coins || 0) + '</div><div class="stat-lbl">🪙 سکه</div></div>';
    html += '<div class="stat-cell"><div class="stat-num">' + fmtNum(u.streak || 0) + '</div><div class="stat-lbl">🔥 ' + t('streak') + '</div></div>';
    html += '<div class="stat-cell"><div class="stat-num">' + fmtNum(u.level || 1) + '</div><div class="stat-lbl">⭐ ' + t('level') + '</div></div>';
    html += '</div></div>';

    html += '</div>';
    return html;
  },

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

  refresh: async function() {
    await this.loadSbUserData();

    var wasTickMode = this._tickMode;

    var c = document.getElementById('profileContent');
    if (c) {
      c.innerHTML = this.render();
      c.classList.remove('anim-fade-in');
      void c.offsetWidth;
      c.classList.add('anim-fade-in');
    }

    if (wasTickMode) {
      setTimeout(function() {
        var picker = document.querySelector('.tick-picker');
        if (picker) {
          picker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 80);
    }

    if (typeof AUTH !== 'undefined' && AUTH.renderStatusCard) {
      setTimeout(function() { AUTH.renderStatusCard(); }, 50);
    }

    if (typeof APP !== 'undefined' && APP.updateHeader) APP.updateHeader();
  },

  init: async function() {
    var u = SHOP.getUser();
    if (!u.ownedTicks) u.ownedTicks = ['star_black'];
    if (!u.selectedTick) u.selectedTick = 'star_black';
    if (!u.avatar) u.avatar = 'male';
    if (u.gems === undefined) u.gems = 0;
    SHOP.saveUser(u);

    await this.loadSbUserData();
  }
};

if (typeof window !== 'undefined') {
  window.PROFILE = PROFILE;
  }
