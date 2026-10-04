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

  // ---- مخفی کردن دکمه‌ها ----
  function hideAuthButtons() {
    let count = 0;
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0) {
        const t = (el.textContent || '').trim();
        // هر عنصری که «ورود» و «ثبت» رو با هم داره
        if (t.includes('ورود') && t.includes('ثبت')) {
          const parent = el.closest('.menu-item, .sidebar-item, li, a, button') || el.parentElement;
          if (parent) {
            parent.style.display = 'none';
            count++;
          }
        }
      }
    });
    console.log('🚫 دکمه‌های ورود/ثبت‌نام مخفی شدند:', count);
  }

  // ---- راه‌اندازی ----
  function init() {
    console.log('🚧 AUTH: غیرفعال (بزودی فعال میشه)');

    // مخفی کردن دکمه‌های ورود
    hideAuthButtons();

    // هر ۱ ثانیه چک کن (اگه منو دوباره باز شد)
    setInterval(hideAuthButtons, 1000);

    // پاک کردن سشن قدیمی
    try {
      localStorage.removeItem('setareh_session');
      localStorage.removeItem('setareh_user');
      console.log('🧹 سشن قدیمی پاک شد');
    } catch(e) {}

    // کارت پروفایل
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

// ⚡ راه‌اندازی خودکار
(function autoStart(){
  const start = () => {
    if (typeof AUTH !== 'undefined' && AUTH.init) {
      AUTH.init();
      console.log('✅ AUTH.init خودکار اجرا شد');
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(start, 300));
  } else {
    setTimeout(start, 300);
  }
  // چک دوباره بعد از ۲ ثانیه
  setTimeout(start, 2000);
})();

console.log('🚧 AUTH: حالت غیرفعال لود شد');
