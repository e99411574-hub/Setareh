// ================================
// js/auth.js — موقتاً غیرفعال
// ورود/ثبت‌نام بزودی فعال میشه
// ================================

const AUTH = (() => {

  function isLoggedIn() { return false; }
  function getUser() { return null; }
  function getSession() { return null; }

  async function signup() {
    showMsg('🚧 ورود و ثبت‌نام بزودی فعال میشه!', true);
    return { ok: false };
  }

  async function login() {
    showMsg('🚧 ورود و ثبت‌نام بزودی فعال میشه!', true);
    return { ok: false };
  }

  async function logout() {
    return { ok: true };
  }

  function showMsg(text, isError) {
    const el = document.getElementById('authMsg');
    if (!el) return;
    el.textContent = text;
    el.style.background = isError ? '#ffa502' : '#00b894';
    el.style.color = '#fff';
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

  // ---- راه‌اندازی ----
  function init() {
    console.log('🚧 AUTH: غیرفعال (بزودی فعال میشه)');

    // ۱) مخفی کردن دکمهٔ ورود/ثبت‌نام از منو
    document.querySelectorAll(
      '[data-route="auth"], .menu-item, .sidebar-item, nav a, button'
    ).forEach(el => {
      const txt = (el.textContent || '').trim();
      if (txt.includes('ورود') || txt.includes('ثبت‌نام') || txt.includes('ثبت نام')) {
        el.style.display = 'none';
        console.log('🚫 مخفی شد:', txt);
      }
    });

    // ۲) مخفی کردن صفحهٔ auth اگه باز شد
    const authView = document.getElementById('view-auth');
    if (authView) {
      // اگه کسی رفتش، پیام نشون بده
      const observer = new MutationObserver(() => {
        if (authView.style.display !== 'none' && authView.style.display !== '') {
          console.log('⚠️ کاربر رفت به صفحهٔ auth — بستن...');
          authView.style.display = 'none';
          const home = document.getElementById('view-home');
          if (home) home.style.display = 'block';
          alert('🚧 ورود و ثبت‌نام بزودی فعال میشه!\nفعلاً می‌تونی از همهٔ امکانات اپ استفاده کنی.');
        }
      });
      observer.observe(authView, { attributes: true, attributeFilter: ['style', 'class'] });
    }

    // ۳) پاک کردن هر سشن قدیمی
    try {
      localStorage.removeItem('setareh_session');
      localStorage.removeItem('setareh_user');
      console.log('🧹 سشن قدیمی پاک شد');
    } catch(e) {}

    // ۴) کارت پروفایل رو مخفی کن اگه هست
    const statusCard = document.getElementById('userStatusCard');
    if (statusCard) {
      statusCard.innerHTML = `
        <div style="padding:24px;text-align:center;color:#636e72;">
          <div style="font-size:48px;margin-bottom:12px;">🚧</div>
          <div style="font-weight:bold;">ورود و ثبت‌نام</div>
          <div style="font-size:13px;margin-top:8px;opacity:.7;">بزودی فعال میشه!</div>
        </div>
      `;
    }
  }

  function renderStatusCard() { /* غیرفعال */ }

  return {
    init, signup, login, logout,
    isLoggedIn, getUser, getSession,
    renderStatusCard, showMsg
  };
})();

console.log('🚧 AUTH: حالت غیرفعال لود شد');
