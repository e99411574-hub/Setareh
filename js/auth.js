// ===== js/auth.js — ورود/ثبت‌نام + نام کاربری =====

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

  // ============ ثبت‌نام ============
  async function signup(email, password, displayName) {
    try {
      if (!email || !password) throw new Error('ایمیل و رمز رو وارد کن');
      if (password.length < 6) throw new Error('رمز باید حداقل ۶ کاراکتر باشه');

      showMsg('⏳ در حال ثبت‌نام...', false);

      const data = await SB.signUp(email, password, {
        display_name: displayName || email.split('@')[0]
      });

      if (data && data.access_token) {
        await onLoginSuccess(data, displayName);
        showMsg('✅ ثبت‌نام موفق! خوش آمدی 🌟', false);
        return { ok: true, user: data.user };
      }

      if (data && data.user && !data.access_token) {
        showMsg('📧 لینک تأیید به ایمیلت فرستادیم', false);
        return { ok: true, needsConfirm: true };
      }

      showMsg('✅ ثبت‌نام انجام شد', false);
      return { ok: true };

    } catch (err) {
      const msg = translateError(err.message);
      showMsg('❌ ' + msg, true);
      return { ok: false, error: msg };
    }
  }

  // ============ ورود ============
  async function login(email, password) {
    try {
      if (!email || !password) throw new Error('ایمیل و رمز رو وارد کن');

      showMsg('⏳ در حال ورود...', false);

      const data = await SB.signIn(email, password);
      await onLoginSuccess(data);
      showMsg('✅ خوش آمدی! 🌟', false);
      return { ok: true, user: data.user };

    } catch (err) {
      const msg = translateError(err.message);
      showMsg('❌ ' + msg, true);
      return { ok: false, error: msg };
    }
  }

  // ============ خروج ============
  async function logout() {
    try {
      if (typeof SB !== 'undefined' && SB.signOut) {
        await SB.signOut();
      }
      showMsg('👋 از حساب خارج شدی', false);
      if (typeof PROFILE !== 'undefined' && PROFILE.refresh) {
        PROFILE.refresh();
      }
      return { ok: true };
    } catch (err) {
      showMsg('❌ خطا در خروج', true);
      return { ok: false };
    }
  }

  // ============ بعد از ورود موفق ============
  async function onLoginSuccess(data, displayName) {
    if (typeof SB !== 'undefined' && SB._saveSession) {
      SB._saveSession();
    }
    await syncUser(displayName);
    updateUserUI();
    if (typeof PROFILE !== 'undefined' && PROFILE.refresh) {
      setTimeout(() => PROFILE.refresh(), 300);
    }
  }

  // ============ سینک کاربر با جدول users ============
  async function syncUser(displayName) {
    try {
      const user = getUser();
      if (!user || !user.id) return;

      const result = await SB.from('users')
        .select('id, username')
        .eq('id', user.id);

      const existing = result && result.data && result.data[0];

      if (existing && existing.id) {
        // کاربر هست → آپدیت last_seen
        await SB.update('users', {
          last_seen: new Date().toISOString()
        }, { id: user.id });

        // اگه username نداره، بساز
        if (!existing.username) {
          const uname = await generateUniqueUsername();
          if (uname) {
            await SB.update('users', { username: uname }, { id: user.id });
            console.log('✅ username ساخته شد:', uname);
          }
        }
        console.log('✅ کاربر قبلاً بود، آپدیت شد');
      } else {
        // کاربر جدید → درج
        const name = displayName
          || (user.user_metadata && user.user_metadata.display_name)
          || user.email.split('@')[0];

        const uname = await generateUniqueUsername();

        await SB.insert('users', {
          id: user.id,
          email: user.email,
          display_name: name,
          username: uname,
          avatar: 'male',
          coins: 100,
          gems: 0,
          level: 1,
          streak_days: 0
        });
        console.log('✅ کاربر جدید درج شد:', name, '— username:', uname);
      }
    } catch (err) {
      console.warn('⚠️ syncUser error:', err.message);
    }
  }

  // ============ تولید username عددی یکتا (۷ رقم) ============
  async function generateUniqueUsername() {
    for (let i = 0; i < 10; i++) {
      const num = Math.floor(1000000 + Math.random() * 9000000);
      const uname = String(num);

      const res = await SB.from('users').select('id').eq('username', uname);
      if (!res.data || !res.data.length) {
        return uname;
      }
    }
    return String(Date.now()).slice(-7);
  }

  // ============ تغییر username ============
  async function updateUsername(newUsername) {
    try {
      const me = getUser();
      if (!me || !me.id) throw new Error('وارد نشدی');

      const uname = (newUsername || '').trim();
      if (uname.length < 4) throw new Error('حداقل ۴ کاراکتر');
      if (uname.length > 20) throw new Error('حداکثر ۲۰ کاراکتر');
      if (!/^[a-zA-Z0-9_]+$/.test(uname)) {
        throw new Error('فقط حرف، عدد و _');
      }

      // چک ادمین
      const userData = await SB.from('users').select('*').eq('id', me.id);
      const meData = userData && userData.data && userData.data[0];
      const isAdmin = meData && meData.is_admin;

      // چک رزرو (فقط ادمین بتونه از رزروها استفاده کنه)
      if (!isAdmin) {
        const reservedRes = await SB.from('reserved_usernames').select('*');
        const reserved = (reservedRes.data || []).map(r => r.username.toLowerCase());
        if (reserved.includes(uname.toLowerCase())) {
          throw new Error('این نام کاربری رزرو شده');
        }
      }

      // چک یکتا بودن
      const existing = await SB.from('users')
        .select('id')
        .eq('username', uname);

      if (existing.data && existing.data.length) {
        const other = existing.data.find(u => u.id !== me.id);
        if (other) throw new Error('این نام کاربری قبلاً گرفته شده');
      }

      // ذخیره
      await SB.update('users', { username: uname }, { id: me.id });
      console.log('✅ username به‌روز شد:', uname);
      return { ok: true, username: uname };
    } catch (err) {
      console.warn('updateUsername error:', err);
      return { ok: false, error: err.message };
    }
  }

  // ============ آپدیت UI ============
  function updateUserUI() {
    const user = getUser();
    const nameEl = document.getElementById('hdrName');
    if (user && nameEl) {
      const name = (user.user_metadata && user.user_metadata.display_name)
        || user.email.split('@')[0];
      nameEl.textContent = name;
    }
  }

  // ============ ترجمهٔ خطاها ============
  function translateError(msg) {
    if (!msg) return 'خطای ناشناخته';
    const m = msg.toLowerCase();

    if (m.includes('already registered') || m.includes('already exists')) {
      return 'این ایمیل قبلاً ثبت شده — وارد شو';
    }
    if (m.includes('invalid login') || m.includes('invalid credentials')) {
      return 'ایمیل یا رمز اشتباهه';
    }
    if (m.includes('email not confirmed')) {
      return 'ایمیل تأیید نشده — برو ایمیلت رو چک کن';
    }
    if (m.includes('password') && m.includes('short')) {
      return 'رمز خیلی کوتاهه (حداقل ۶ کاراکتر)';
    }
    if (m.includes('rate limit')) {
      return 'زیادی تلاش کردی — چند دقیقه صبر کن';
    }
    if (m.includes('network') || m.includes('fetch')) {
      return 'اتصال اینترنت رو چک کن';
    }
    return msg;
  }

  // ============ نمایش پیام ============
  function showMsg(text, isError) {
    let el = document.getElementById('authMsg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'authMsg';
      el.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);' +
        'padding:12px 20px;border-radius:12px;font-weight:bold;z-index:9999;' +
        'box-shadow:0 4px 20px rgba(0,0,0,0.2);display:none;max-width:90%;text-align:center;';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.background = isError ? '#e74c3c' : '#00b894';
    el.style.color = '#fff';
    el.style.display = 'block';
    clearTimeout(window._authMsgTimer);
    window._authMsgTimer = setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

  // ============ کارت وضعیت ============
  function renderStatusCard() {
    const card = document.getElementById('userStatusCard');
    if (!card) return;

    if (isLoggedIn()) {
      const user = getUser();
      const email = user ? user.email : '';
      const name = (user && user.user_metadata && user.user_metadata.display_name)
        || (email ? email.split('@')[0] : 'کاربر');

      card.innerHTML = `
        <div style="background:linear-gradient(135deg,#00b894,#00cec9);border-radius:16px;padding:18px;color:#fff;text-align:center;box-shadow:0 4px 20px rgba(0,184,148,.3);margin-bottom:16px;">
          <div style="font-size:32px;margin-bottom:6px;">✅</div>
          <div style="font-weight:bold;font-size:16px;">وارد شدی، ${escapeHtml(name)}!</div>
          <div style="font-size:12px;margin-top:6px;opacity:.9;">📧 ${escapeHtml(email)}</div>
          <button onclick="AUTH.logout()" style="margin-top:14px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);color:#fff;padding:8px 20px;border-radius:20px;font-family:inherit;font-size:13px;cursor:pointer;">
            خروج از حساب
          </button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div style="background:linear-gradient(135deg,#6C5CE7,#0984E3);border-radius:16px;padding:20px;color:#fff;text-align:center;box-shadow:0 4px 20px rgba(108,92,231,.3);margin-bottom:16px;">
          <div style="font-size:32px;margin-bottom:8px;">👤</div>
          <div style="font-weight:bold;font-size:15px;">مهمان عزیز</div>
          <div style="font-size:12px;margin-top:6px;opacity:.85;line-height:1.5;">
            برای ذخیرهٔ آنلاین، چت و دوستی وارد شو
          </div>
          <div style="display:flex;gap:10px;margin-top:16px;justify-content:center;">
            <button onclick="AUTH.showForm('login')" style="flex:1;background:#fff;color:#6C5CE7;border:none;padding:10px;border-radius:12px;font-family:inherit;font-weight:bold;font-size:14px;cursor:pointer;">ورود</button>
            <button onclick="AUTH.showForm('signup')" style="flex:1;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.5);color:#fff;padding:10px;border-radius:12px;font-family:inherit;font-weight:bold;font-size:14px;cursor:pointer;">ثبت‌نام</button>
          </div>
        </div>
      `;
    }
  }

  // ============ فرم ورود/ثبت‌نام ============
  function showForm(mode) {
    const isSignup = mode === 'signup';
    closeForm();

    const overlay = document.createElement('div');
    overlay.id = 'authOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);' +
      'display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;';

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:24px;width:100%;max-width:380px;position:relative;animation:authPop .3s ease;">
        <button onclick="AUTH.closeForm()" style="position:absolute;top:12px;left:12px;background:#f0f0f5;border:none;width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer;">✕</button>
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:40px;">⭐</div>
          <div style="font-weight:bold;font-size:18px;color:#2d3436;margin-top:6px;">
            ${isSignup ? 'ثبت‌نام در ستاره' : 'ورود به ستاره'}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${isSignup ? `<input id="authName" type="text" placeholder="نام نمایشی (اختیاری)" style="padding:12px;border:2px solid #e0e0e0;border-radius:12px;font-family:inherit;font-size:14px;text-align:center;">` : ''}
          <input id="authEmail" type="email" placeholder="ایمیل" dir="ltr" style="padding:12px;border:2px solid #e0e0e0;border-radius:12px;font-family:inherit;font-size:14px;text-align:center;">
          <input id="authPassword" type="password" placeholder="رمز (حداقل ۶ کاراکتر)" dir="ltr" style="padding:12px;border:2px solid #e0e0e0;border-radius:12px;font-family:inherit;font-size:14px;text-align:center;">
          <button id="authSubmit" onclick="AUTH.${isSignup ? 'submitSignup' : 'submitLogin'}()" style="background:linear-gradient(135deg,#6C5CE7,#0984E3);color:#fff;border:none;padding:14px;border-radius:12px;font-family:inherit;font-weight:bold;font-size:15px;cursor:pointer;box-shadow:0 4px 15px rgba(108,92,231,.4);">
            ${isSignup ? 'ثبت‌نام' : 'ورود'}
          </button>
          <div style="text-align:center;font-size:13px;color:#636e72;margin-top:6px;">
            ${isSignup ? 'حساب داری؟' : 'حساب نداری؟'}
            <a onclick="AUTH.showForm('${isSignup ? 'login' : 'signup'}')" style="color:#6C5CE7;font-weight:bold;cursor:pointer;">
              ${isSignup ? 'وارد شو' : 'ثبت‌نام کن'}
            </a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
      const passEl = document.getElementById('authPassword');
      if (passEl) {
        passEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            isSignup ? submitSignup() : submitLogin();
          }
        });
      }
    }, 100);
  }

  function closeForm() {
    const el = document.getElementById('authOverlay');
    if (el) el.remove();
  }

  // ============ Submit ============
  async function submitSignup() {
    const email = (document.getElementById('authEmail') || {}).value || '';
    const password = (document.getElementById('authPassword') || {}).value || '';
    const name = (document.getElementById('authName') || {}).value || '';

    const res = await signup(email.trim(), password, name.trim());
    if (res.ok) {
      closeForm();
      renderStatusCard();
    }
  }

  async function submitLogin() {
    const email = (document.getElementById('authEmail') || {}).value || '';
    const password = (document.getElementById('authPassword') || {}).value || '';

    const res = await login(email.trim(), password);
    if (res.ok) {
      closeForm();
      renderStatusCard();
    }
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
    if (typeof SB !== 'undefined' && SB.init) {
      SB.init();
    }
    if (isLoggedIn()) {
      await syncUser();
      updateUserUI();
    }
    console.log('✅ AUTH: فعال شد — ' + (isLoggedIn() ? 'کاربر وارد شده' : 'مهمان'));
  }

  return {
    init, signup, login, logout,
    isLoggedIn, getUser, getSession,
    renderStatusCard, showForm, closeForm,
    submitSignup, submitLogin,
    syncUser, updateUsername, generateUniqueUsername
  };
})();

console.log('🔐 AUTH: آماده');
