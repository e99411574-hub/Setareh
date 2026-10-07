// ===== js/missions.js — ماموریت‌های بازی (ریست هر ۱۲ ساعت) =====

var MISSIONS = {
  TWELVE_HOURS: 12 * 60 * 60 * 1000,

  // تعریف ماموریت‌ها
  list: [
    { id: 'rps_win_5',    game: 'rps',    icon: '✊',  label: 'برد سنگ کاغذ',   target: 5,  reward: 500,  type: 'win' },
    { id: 'rps_win_20',   game: 'rps',    icon: '🏆',  label: 'برد سنگ کاغذ',   target: 20, reward: 1500, type: 'win' },
    { id: 'ttt_win_3',    game: 'ttt',    icon: '❌',  label: 'برد دوز',         target: 3,  reward: 700,  type: 'win' },
    { id: 'guess_win_5',  game: 'guess',  icon: '🔢',  label: 'برد حدس عدد',    target: 5,  reward: 500,  type: 'win' },
    { id: 'memory_win_3', game: 'memory', icon: '🃏',  label: 'برد حافظه',       target: 3,  reward: 600,  type: 'win' },
    { id: 'play_total_20',game: 'all',    icon: '🎮',  label: 'بازی کل',         target: 20, reward: 800,  type: 'play' }
  ],

  init: function() {
    this.checkReset();
    console.log('🎯 MISSIONS: آماده');
  },

  // ============ چک ریست ============
  checkReset: function() {
    var data = STATE.get('missions') || {};
    var now = Date.now();
    if (!data.lastReset || (now - data.lastReset) > this.TWELVE_HOURS) {
      data = {
        lastReset: now,
        progress: {},
        claimed: {}
      };
      this.list.forEach(function(m) {
        data.progress[m.id] = 0;
        data.claimed[m.id] = false;
      });
      STATE.set('missions', data);
      STATE.save('missions');
    }
    return data;
  },

  // ============ ثبت بازی ============
  trackGame: function(gameId, won) {
    var data = this.checkReset();
    var changed = false;

    this.list.forEach(function(m) {
      if (m.claimed) return;
      // اگه ماموریت مربوط به این بازیه یا ماموریت کلی
      if (m.game === gameId || m.game === 'all') {
        // اگه type=win، فقط برد حساب میشه
        if (m.type === 'win' && !won) return;
        // اگه type=play، هر بازی حساب میشه
        if (m.type === 'play') {
          data.progress[m.id] = (data.progress[m.id] || 0) + 1;
          changed = true;
        } else if (m.type === 'win' && won) {
          data.progress[m.id] = (data.progress[m.id] || 0) + 1;
          changed = true;
        }
      }
    });

    if (changed) {
      STATE.set('missions', data);
      STATE.save('missions');
    }
  },

  // ============ گرفتن جایزه ============
  claim: function(missionId) {
    var data = this.checkReset();
    var m = this.list.find(function(x) { return x.id === missionId; });
    if (!m) return;
    if (data.claimed[m.id]) {
      if (typeof showToast === 'function') showToast('❌ قبلاً گرفتی');
      return;
    }
    if ((data.progress[m.id] || 0) < m.target) {
      if (typeof showToast === 'function') showToast('❌ هنوز کامل نشده');
      return;
    }

    data.claimed[m.id] = true;
    STATE.set('missions', data);
    STATE.save('missions');

    // اضافه کردن الماس
    var user = STATE.getUser();
    user.gems = (user.gems || 0) + m.reward;
    STATE.saveUser(user);

    if (typeof showToast === 'function') showToast('🎁 ' + m.reward + ' الماس گرفتی!');
    if (typeof playSnd === 'function') playSnd('success');
    if (typeof APP !== 'undefined' && APP.updateHeader) APP.updateHeader();

    // رفرش صفحه
    if (typeof APP !== 'undefined' && APP.renderHome) APP.renderHome();
  },

  // ============ رندر ماموریت‌های خانه ============
  renderHome: function() {
    var data = this.checkReset();
    var self = this;

    var html = '<div class="abad-card">';
    html += '<div class="abad-title">';
    html += '<div class="left"><span class="icon">🎯</span>ماموریت آباد ...</div>';
    html += '<span class="info-icon">i</span>';
    html += '</div>';
    html += '<div class="missions-grid">';

    this.list.forEach(function(m) {
      var prog = data.progress[m.id] || 0;
      var isClaimed = data.claimed[m.id];
      var isDone = prog >= m.target;

      var cls = 'mission-tile';
      if (isClaimed) cls += ' m-done';

      var onclick = '';
      if (isDone && !isClaimed) {
        onclick = 'onclick="MISSIONS.claim(\'' + m.id + '\')"';
      }

      html += '<div class="' + cls + '" ' + onclick + '>';
      html += '<div class="m-badge">' + prog + '</div>';
      html += '<div class="m-top"><span class="m-icon">' + m.icon + '</span></div>';
      html += '<div class="m-nums">' + prog + ' / ' + m.target + '</div>';
      html += '<div class="m-reward">💎 ' + m.reward + '</div>';
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  },

  // ============ رندر قدیمی (سازگاری) ============
  render: function() {
    return '';
  },

  // ============ توابع قدیمی (سازگاری) ============
  trackShop: function() {},
  trackWin: function() {}
};

if (typeof window !== 'undefined') {
  window.MISSIONS = MISSIONS;
}
