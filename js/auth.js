// ================================
// js/auth.js — ورود/ثبت‌نام/خروج
// ================================

const AUTH = (() => {
  // --- ذخیره‌سازی سشن ---
  const SESSION_KEY = 'setareh_session';
  const USER_KEY = 'setareh_user';

  function saveSession(data) {
    try {
      if (data && data.access_token) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: Date.now() + (data.expires_in || 3600) * 1000
        }));
        localStorage.setItem(USER_KEY, JSON.stringify({
          id: data.user?.id,
          email: data.user?.email,
          created_at: data.user?.created_at
        }));
        console.log('✅ AUTH: سشن ذخیره شد');
      }
    } catch (e) {
      console.error('❌ AUTH save error:', e);
    }
  }

  function getSession() {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  }

  function getUser() {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    console.log('🧹 AUTH: سشن پاک شد');
  }

  // --- ثبت‌نام ---
  async function signup(email, password) {
    console.log('📝 AUTH: تلاش ثبت‌نام...', email);
    try {
      const res = await fetch(SB.url + '/auth/v1/signup', {
        method: 'POST',
        headers: {
          'apikey': SB.key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      console.log('📥 AUTH signup status:', res.status);
      console.log('📥 AUTH signup body:', data);

      if (!res.ok) {
        // خطای دقیق
        const msg = data.msg || data.error_description || data.error || 'خطا در ثبت‌نام';
        console.error('❌ AUTH signup error:', msg);
        throw new Error(msg);
      }

      // اگه session داره (تأیید ایمیل خاموشه)
      if (data.access_token) {
        saveSession(data);
        return { ok: true, user: data.user };
      }

      // اگه session نداره (تأیید ایمیل روشنه)
      return { ok: true, user: data.user || data, needConfirm: true };
    } catch (e) {
      console.error('❌ AUTH signup catch:', e);
      throw e;
    }
  }

  // --- ورود ---
  async function login(email, password) {
    console.log('🔑 AUTH: تلاش ورود...', email);
    try {
      const res = await fetch(SB.url + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'apikey': SB.key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      console.log('📥 AUTH login status:', res.status);
      console.log('📥 AUTH login body:', data);

      if (!res.ok) {
        const msg = data.error_description || data.msg || data.error || 'ایمیل یا رمز اشتباهه';
        console.error('❌ AUTH login error:', msg);
        throw new Error(msg);
      }

      saveSession(data);
      return { ok: true, user: data.user };
    } catch (e) {
      console.error('❌ AUTH login catch:', e);
      throw e;
    }
  }

  // --- خروج ---
  async function logout() {
    console.log('👋 AUTH: خروج...');
    try {
      const s = getSession();
      if (s && s.access_token) {
        await fetch(SB.url + '/auth/v1/logout', {
          method: 'POST',
          headers: {
            'apikey': SB.key,
            'Authorization': 'Bearer ' + s.access_token
          }
        });
      }
    } catch (e) {
      console.warn('⚠️ AUTH logout server error (بی‌خطر):', e);
    }
    clearSession();
    return { ok: true };
  }

  // --- بررسی ورود ---
  function isLoggedIn() {
    const s = getSession();
    if (!s || !s.access_token) return false;
    return true;
  }

  // --- نمایش پیام ---
  function showMsg(text, isError) {
    const el = document.getElementById('authMsg');
    if (!el) return;
    el.textContent = text;
    el.style.background = isError ? '#ff6b6b' : '#00b894';
    el.style.color = '#fff';
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

  // --- راه‌اندازی UI ---
  function init() {
    console.log('🚀 AUTH.init');
    const tabs = document.querySelectorAll('.auth-tab');
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');
    let mode = 'login';

    // تب‌ها
    tabs.forEach(t => {
      t.addEventListener('click', () => {
        tabs.forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        mode = t.dataset.mode || 'login';
        const title = document.getElementById('authTitle');
        if (title) title.textContent = mode === 'signup' ? '✨ ثبت‌نام' : '🔑 ورود';
        const mainBtn = document.getElementById('authSubmit');
        if (mainBtn) {
          mainBtn.textContent = mode === 'signup' ? '✨ ثبت‌نام' : '🔑 ورود به حساب';
        }
      });
    });

    // دکمهٔ اصلی (اگه جداست)
    const mainBtn = document.getElementById('authSubmit');
    if (mainBtn) {
      mainBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = (emailInput?.value || '').trim();
        const password = (passInput?.value || '').trim();
        if (!email || !password) { showMsg('ایمیل و رمز رو پر کن', true); return; }
        if (password.length < 6) { showMsg('رمز حداقل ۶ کاراکتر', true); return; }
        try {
          if (mode === 'signup') {
            await signup(email, password);
            showMsg('✅ ثبت‌نام موفق!', false);
          } else {
            await login(email, password);
            showMsg('✅ ورود موفق!', false);
          }
          setTimeout(() => {
            if (typeof renderStatusCard === 'function') renderStatusCard();
            if (typeof Router !== 'undefined') Router.go('profile');
            else location.reload();
          }, 800);
        } catch (err) {
          showMsg('❌ ' + err.message, true);
        }
      });
    }

    // دکمه‌های قدیمی (اگه هستن)
    if (signupBtn) signupBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = (emailInput?.value || '').trim();
      const password = (passInput?.value || '').trim();
      if (!email || !password) { showMsg('ایمیل و رمز رو پر کن', true); return; }
      try {
        await signup(email, password);
        showMsg('✅ ثبت‌نام موفق!', false);
        setTimeout(() => location.reload(), 800);
      } catch (err) { showMsg('❌ ' + err.message, true); }
    });

    if (loginBtn) loginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = (emailInput?.value || '').trim();
      const password = (passInput?.value || '').trim();
      if (!email || !password) { showMsg('ایمیل و رمز رو پر کن', true); return; }
      try {
        await login(email, password);
        showMsg('✅ ورود موفق!', false);
        setTimeout(() => location.reload(), 800);
      } catch (err) { showMsg('❌ ' + err.message, true); }
    });

    // خروج
    if (logoutBtn) logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await logout();
      showMsg('👋 خارج شدی', false);
      setTimeout(() => location.reload(), 800);
    });

    // رندر کارت
    renderStatusCard();
  }

  // --- کارت وضعیت پروفایل ---
  function renderStatusCard() {
    const el = document.getElementById('userStatusCard');
    if (!el) return;
    const u = getUser();
    if (u && u.email) {
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:16px;background:linear-gradient(135deg,#6C5CE7,#0984E3);border-radius:16px;color:#fff;margin:12px;">
          <div style="width:48px;height:48px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;">✅</div>
          <div>
            <div style="font-weight:bold;">وارد شدی</div>
            <div style="font-size:13px;opacity:.9;">${u.email}</div>
          </div>
        </div>
        <button id="logoutBtn2" style="width:calc(100% - 24px);margin:0 12px;padding:14px;background:#ff6b6b;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:bold;">📕 خروج از حساب</button>
      `;
      document.getElementById('logoutBtn2')?.addEventListener('click', async () => {
        await logout();
        location.reload();
      });
    } else {
      el.innerHTML = `
        <div style="padding:24px;text-align:center;color:#636e72;">
          <div style="font-size:48px;margin-bottom:12px;">👤</div>
          <div>وارد نشدی</div>
          <div style="font-size:13px;margin-top:8px;opacity:.7;">برای ذخیرهٔ امتیازها وارد شو</div>
        </div>
      `;
    }
  }

  // --- API عمومی ---
  return {
    init, signup, login, logout,
    isLoggedIn, getUser, getSession,
    renderStatusCard, showMsg
  };
})();
