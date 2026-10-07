// ===== js/wheel.js — گردونهٔ شانس (الماس + پانی) =====

var WHEEL = {
  // ۸ بخش گردونه
  segments: [
    { type: 'gems', amount: 100,  label: '۱۰۰ الماس',  icon: '💎', color: '#b8a0e8' },
    { type: 'pani', amount: 20,   label: '۲۰ پانی',    icon: '🔷', color: '#81ecec' },
    { type: 'gems', amount: 300,  label: '۳۰۰ الماس',  icon: '💎', color: '#a78bfa' },
    { type: 'none', amount: 0,    label: 'پوچ',        icon: '😢', color: '#dfe6e9' },
    { type: 'pani', amount: 50,   label: '۵۰ پانی',    icon: '🔷', color: '#74c0fc' },
    { type: 'gems', amount: 200,  label: '۲۰۰ الماس',  icon: '💎', color: '#8b5cf6' },
    { type: 'gems', amount: 500,  label: '۵۰۰ الماس',  icon: '💎', color: '#6C5CE7' },
    { type: 'pani', amount: 100,  label: '۱۰۰ پانی',   icon: '🔷', color: '#00cec9' }
  ],

  DAILY_MS: 24 * 60 * 60 * 1000,
  _spinning: false,

  init: function() {
    console.log('🎡 WHEEL: آماده');
  },

  // ============ چک روزانه ============
  _canSpin: function() {
    var data = STATE.get('wheel') || {};
    var now = Date.now();
    if (!data.lastSpin) return true;
    return (now - data.lastSpin) >= this.DAILY_MS;
  },

  _remainingTime: function() {
    var data = STATE.get('wheel') || {};
    if (!data.lastSpin) return 0;
    var rem = this.DAILY_MS - (Date.now() - data.lastSpin);
    return Math.max(0, rem);
  },

  _formatRemaining: function() {
    var ms = this._remainingTime();
    if (ms <= 0) return '';
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    var toFa = function(n) { return String(n).replace(/\d/g, function(x) { return ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'][+x]; }); };
    if (h > 0) return toFa(h) + ' ساعت و ' + toFa(m) + ' دقیقه';
    return toFa(m) + ' دقیقه';
  },

  // ============ باز کردن گردونه ============
  open: function() {
    var canSpin = this._canSpin();
    var remaining = canSpin ? '' : this._formatRemaining();

    var overlay = document.createElement('div');
    overlay.id = 'wheelOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);' +
      'display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;backdrop-filter:blur(8px);';

    var segsHtml = '';
    var n = this.segments.length;
    var angle = 360 / n;

    this.segments.forEach(function(s, i) {
      var rot = i * angle;
      segsHtml += '<div class="wheel-seg" style="position:absolute;top:0;left:50%;width:0;height:50%;' +
        'transform-origin:bottom center;transform:translateX(-50%) rotate(' + rot + 'deg);">' +
        '<div style="position:absolute;top:8px;left:-30px;width:60px;text-align:center;">' +
        '<div style="font-size:22px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3));">' + s.icon + '</div>' +
        '<div style="font-size:9px;color:#fff;font-weight:900;text-shadow:0 1px 3px rgba(0,0,0,.6);margin-top:2px;">' + s.label + '</div>' +
        '</div>' +
        '</div>';
    });

    var conicStr = '';
    this.segments.forEach(function(s, i) {
      var start = i * angle;
      var end = (i + 1) * angle;
      conicStr += s.color + ' ' + start + 'deg ' + end + 'deg';
      if (i < n - 1) conicStr += ', ';
    });

    overlay.innerHTML = `
      <div style="background:linear-gradient(160deg,#f8f4ff,#ede7f6);border-radius:28px;padding:24px;width:100%;max-width:420px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.4);">
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:20px;font-weight:900;color:#4a3a6b;">🎡 گردونهٔ شانس</div>
          <div style="font-size:12px;color:#b8a8d8;margin-top:4px;">${canSpin ? 'امروز شانست رو امتحان کن!' : 'دفعهٔ بعد: ' + remaining}</div>
        </div>

        <div style="position:relative;width:280px;height:280px;margin:0 auto;filter:drop-shadow(0 8px 24px rgba(108,92,231,.3));">
          <!-- فلش بالا -->
          <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:32px;z-index:10;filter:drop-shadow(0 3px 6px rgba(0,0,0,.3));">▼</div>

          <!-- چرخ -->
          <div id="wheelDisk" style="position:relative;width:100%;height:100%;border-radius:50%;background:conic-gradient(from -22.5deg, ${conicStr});border:8px solid #FDCB6E;box-shadow:inset 0 0 0 4px #fff, 0 0 0 4px #E67E22, 0 4px 16px rgba(230,126,34,.5);transition:transform 4s cubic-bezier(.17,.67,.2,1);">
            ${segsHtml}
          </div>

          <!-- دکمهٔ مرکز -->
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#FDCB6E,#E67E22);display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;font-weight:900;box-shadow:0 4px 12px rgba(0,0,0,.3),inset 0 2px 4px rgba(255,255,255,.4);border:3px solid #fff;z-index:5;cursor:pointer;" onclick="WHEEL.spin()">⭐</div>
        </div>

        ${canSpin
          ? '<button id="spinBtn" onclick="WHEEL.spin()" style="width:100%;margin-top:20px;padding:16px;border:none;border-radius:16px;background:linear-gradient(135deg,#6C5CE7,#0984E3);color:#fff;font-family:inherit;font-weight:900;font-size:16px;cursor:pointer;box-shadow:0 6px 20px rgba(108,92,231,.4);">🎯 بچرخون!</button>'
          : '<button disabled style="width:100%;margin-top:20px;padding:16px;border:none;border-radius:16px;background:#dfe6e9;color:#95a5a6;font-family:inherit;font-weight:900;font-size:16px;cursor:not-allowed;">⏳ ' + remaining + ' دیگر</button>'
        }

        <button onclick="WHEEL.close()" style="width:100%;margin-top:10px;padding:12px;border:none;border-radius:14px;background:rgba(0,0,0,.06);color:#6b5b8b;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;">بستن</button>
      </div>
    `;

    document.body.appendChild(overlay);
    if (typeof playSnd === 'function') playSnd('tap');
  },

  close: function() {
    var el = document.getElementById('wheelOverlay');
    if (el) el.remove();
  },

  // ============ چرخاندن ============
  spin: function() {
    if (this._spinning) return;
    if (!this._canSpin()) {
      if (typeof showToast === 'function') showToast('⏳ هنوز وقت نشده');
      return;
    }

    this._spinning = true;

    // انتخاب تصادفی یه بخش
    var idx = Math.floor(Math.random() * this.segments.length);
    var seg = this.segments[idx];

    // محاسبهٔ زاویه
    var n = this.segments.length;
    var anglePerSeg = 360 / n;
    // مرکز بخش انتخاب شده
    var centerAngle = idx * anglePerSeg + anglePerSeg / 2;
    // ۵ دور کامل + زاویهٔ برگشت (چون چرخش خلاف عقربه‌هاست)
    var totalRotation = (360 * 5) + (360 - centerAngle);

    var disk = document.getElementById('wheelDisk');
    if (!disk) { this._spinning = false; return; }

    disk.style.transform = 'rotate(' + totalRotation + 'deg)';

    if (typeof playSnd === 'function') playSnd('tap');

    var self = this;
    setTimeout(function() {
      self._spinning = false;
      self._applyReward(seg);
    }, 4200);
  },

  // ============ اعمال جایزه ============
  _applyReward: function(seg) {
    var user = STATE.getUser();

    // ذخیره سابقهٔ چرخش
    var data = STATE.get('wheel') || {};
    data.lastSpin = Date.now();
    STATE.set('wheel', data);
    STATE.save('wheel');

    if (seg.type === 'gems') {
      user.gems = (user.gems || 0) + seg.amount;
      STATE.saveUser(user);
      if (typeof APP !== 'undefined' && APP.updateHeader) APP.updateHeader();
      if (typeof playSnd === 'function') playSnd('success');
      this._showResult('💎', seg.amount + ' الماس', '#6C5CE7');
    } else if (seg.type === 'pani') {
      user.pani = (user.pani || 0) + seg.amount;
      STATE.saveUser(user);
      if (typeof APP !== 'undefined' && APP.updateHeader) APP.updateHeader();
      if (typeof playSnd === 'function') playSnd('success');
      this._showResult('🔷', seg.amount + ' پانی', '#00cec9');
    } else {
      if (typeof playSnd === 'function') playSnd('error');
      this._showResult('😢', 'این دفعه پوچ!', '#95a5a6');
    }

    // رفرش خانه
    if (typeof APP !== 'undefined' && APP.renderHome) {
      setTimeout(function() { APP.renderHome(); }, 100);
    }
  },

  // ============ نمایش نتیجه ============
  _showResult: function(icon, text, color) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);' +
      'display:flex;align-items:center;justify-content:center;z-index:10001;padding:20px;backdrop-filter:blur(10px);';

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:28px;padding:32px 24px;text-align:center;max-width:340px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.5);animation:resultPop .4s cubic-bezier(.34,1.56,.64,1);">
        <div style="font-size:72px;margin-bottom:12px;animation:resultSpin .8s ease;">${icon}</div>
        <div style="font-size:20px;font-weight:900;color:${color};margin-bottom:6px;">${text}</div>
        <div style="font-size:13px;color:#b8a8d8;margin-bottom:20px;">تبریک! به حساب اضافه شد</div>
        <button onclick="this.parentElement.parentElement.remove()" style="width:100%;padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,${color},#8b5cf6);color:#fff;font-family:inherit;font-weight:900;font-size:15px;cursor:pointer;">عالیه!</button>
      </div>
      <style>
        @keyframes resultPop { from{transform:scale(.6);opacity:0;} to{transform:scale(1);opacity:1;} }
        @keyframes resultSpin { from{transform:rotate(0deg) scale(0);} to{transform:rotate(360deg) scale(1);} }
      </style>
    `;

    document.body.appendChild(overlay);
  },

  // ============ سازگاری ============
  renderSection: function() { return ''; }
};

if (typeof window !== 'undefined') {
  window.WHEEL = WHEEL;
}
