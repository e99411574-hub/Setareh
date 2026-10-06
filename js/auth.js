// ===== js/auth.js — ورود خودکار مهمان =====

const AUTH = (() => {

  // ============ وضعیت ============
  function isLoggedIn() {
    return typeof SB !== 'undefined' && SB.isLoggedIn && SB.isLoggedIn();
  }

  function getUser() {
    if (typeof SB === 'undefined') return null;
    return SB.getUser ? SB.getUser() : null;
  }

  function getSession() {
    if (typeof SB === 'undefined') return null;
    return SB.getSession ? SB.getSession() : null;
  }

  // ============ ورود مهمان خودکار ============
  async function autoLogin() {
    if (typeof SB === 'undefined') return false;

    SB.init();

    // اگه سشن قبلی هست، ازش استفاده کن
    if (SB.isLoggedIn && SB.isLoggedIn()) {
      await syncUser();
      updateUserUI();
      startLastSeenUpdater();
      console.log('✅ کاربر قبلاً وارد شده');
      return true;
    }

    // وگرنه حساب مهمان بساز
    console.log('⏳ ساخت حساب مهمان...');
    try {
      await SB.signInAnonymously();
      await syncUser();
      updateUserUI();
      startLastSeenUpdater();
      console.log('✅ حساب مهمان ساخته شد');
      return true;
    } catch (err) {
      console.warn('❌ خطا در ورود مهمان:', err.message);
      return false;
    }
  }

  // ============ خروج ============
  async function logout() {
    try {
      if (typeof SB !== 'undefined' && SB.signOut) {
        await SB.signOut();
      }
      localStorage.removeItem('setareh_sb_session');
      if (typeof showToast === 'function') showToast('👋 خارج شدی');
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      if (typeof showToast === 'function') showToast('❌ خطا');
    }
  }

  // ============ sync با جدول users ============
  async function syncUser() {
    try {
      const user = getUser();
      if (!user || !user.id) return;

      const result = await SB.from('users')
        .select('id, username, display_name, is_admin, is_verified')
        .eq('id', user.id);

      const existing = result && result.data && result.data[0];

      if (existing && existing.id) {
        await SB.update('users', {
          last_seen: new Date().toISOString()
        }, { id: user.id });

        if (!existing.username) {
          const uname = await generateUniqueUsername();
          await SB.update('users', { username: uname }, { id: user.id });
        }
        console.log('✅ کاربر آپدیت شد');
      } else {
        const name = 'مهمان ' + Math.floor(Math.random() * 9000 + 1000);
        const uname = await generateUniqueUsername();

        await SB.insert('users', {
          id: user.id,
          email: null,
          display_name: name,
          username: uname,
          avatar: 'male',
          coins: 100,
          gems: 0,
          level: 1,
          streak_days: 0
        });
        console.log('✅ کاربر جدید مهمان:', name, '— @' + uname);
      }
    } catch (err) {
      console.warn('syncUser error:', err.message);
    }
  }

  // ============ username عددی یکتا ============
  async function generateUniqueUsername() {
    for (let i = 0; i < 10; i++) {
      const num = Math.floor(1000000 + Math.random() * 9000000);
      const uname = String(num);
      const res = await SB.from('users').select('id').eq('username', uname);
      if (!res.data || !res.data.length) return uname;
    }
    return String(Date.now()).slice(-7);
  }

  // ============ تغییر username (فقط ادمین) ============
  async function updateUsername(newUsername) {
    try {
      const me = getUser();
      if (!me || !me.id) throw new Error('وارد نشدی');

      const userData = await SB.from('users').select('*').eq('id', me.id);
      const meData = userData && userData.data && userData.data[0];
      const isAdmin = meData && meData.is_admin;

      if (!isAdmin) throw new Error('فقط مدیر می‌تونه تغییر بده');

      const uname = (newUsername || '').trim();
      if (uname.length < 4) throw new Error('حداقل ۴ کاراکتر');
      if (!/^[a-zA-Z0-9_]+$/.test(uname)) throw new Error('فقط حرف، عدد و _');

      const existing = await SB.from('users').select('id').eq('username', uname);
      if (existing.data && existing.data.length) {
        const other = existing.data.find(u => u.id !== me.id);
        if (other) throw new Error('قبلاً گرفته شده');
      }

      await SB.update('users', { username: uname }, { id: me.id });
      return { ok: true, username: uname };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // ============ last_seen updater ============
  let _lastSeenTimer = null;
  function startLastSeenUpdater() {
    if (_lastSeenTimer) clearInterval(_lastSeenTimer);
    async function tick() {
      const user = getUser();
      if (!user || !user.id) return;
      try {
        await SB.update('users', {
          last_seen: new Date().toISOString()
        }, { id: user.id });
      } catch (e) {}
    }
    tick();
    _lastSeenTimer = setInterval(tick, 30000);
  }

  // ============ UI ============
  async function updateUserUI() {
    const user = getUser();
    if (!user) return;

    try {
      const res = await SB.from('users').select('*').eq('id', user.id);
      const data = res && res.data && res.data[0];
      if (data) {
        STATE.set('sbUserData', data);
        const nameEl = document.getElementById('hdrName');
        if (nameEl) nameEl.textContent = data.display_name || 'مهمان';
      }
    } catch (e) {}
  }

  // ============ کارت وضعیت ============
  function renderStatusCard() {
    const card = document.getElementById('userStatusCard');
    if (!card) return;

    const sbData = STATE.get('sbUserData');
    if (!sbData) {
      card.innerHTML = '';
      return;
    }

    const name = sbData.display_name || 'مهمان';
    const uname = sbData.username || '';
    const isAdmin = sbData.is_admin;
    const isVerified = sbData.is_verified;

    let badge = '';
    if (isVerified) badge += ' <span style="color:#FDCB6E;font-size:16px;">✓</span>';
    if (isAdmin) badge += ' <span style="font-size:16px;">👑</span>';

    card.innerHTML = `
      <div style="background:linear-gradient(135deg,#6C5CE7,#0984E3);border-radius:16px;padding:16px;color:#fff;text-align:center;box-shadow:0 4px 20px rgba(108,92,231,.3);margin-bottom:16px;">
        <div style="font-size:28px;margin-bottom:4px;">👤</div>
        <div style="font-weight:bold;font-size:15px;">${escapeHtml(name)}${badge}</div>
        <div style="font-size:12px;margin-top:4px;opacity:.85;direction:ltr;">@${escapeHtml(uname)}</div>
        <div style="font-size:11px;margin-top:6px;opacity:.7;">حساب مهمان (موقت)</div>
      </div>
    `;
  }

  // ============ escape ============
  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  // ============ init ============
  async function init() {
    await autoLogin();
    console.log('✅ AUTH: آماده');
  }

  // ============ توابع قدیمی (برای سازگاری با کدهای قبلی) ============
  function showForm() {}
  function closeForm() {}
  function showAdminLogin() {}
  async function submitAdminLogin() {}
  async function signup() { return { ok: false }; }
  async function login() { return { ok: false }; }
  async function submitLogin() {}
  async function submitSignup() {}

  return {
    init, signup, login, logout,
    isLoggedIn, getUser, getSession,
    renderStatusCard, showForm, closeForm,
    submitLogin, submitSignup,
    syncUser, updateUsername, generateUniqueUsername,
    startLastSeenUpdater, autoLogin,
    showAdminLogin, submitAdminLogin
  };
})();

console.log('🔐 AUTH: آماده');
