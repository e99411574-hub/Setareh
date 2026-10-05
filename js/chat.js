// ===== js/chat.js — چت، دوستان، ویس، عکس =====

const CHAT = (() => {

  let _tab = 'friends';     // 'friends' | 'search' | 'requests'
  let _searchQuery = '';
  let _currentRoom = null;  // کاربری که توش چت بازه
  let _messages = [];       // پیام‌های گفتگوی فعلی
  let _refreshTimer = null;
  let _mediaRecorder = null;
  let _audioChunks = [];
  let _recordingStart = 0;

  // ============ init ============
  function init() {
    console.log('💬 CHAT: آماده');
  }

  // ============ رندر اصلی ============
  function render() {
    const c = document.getElementById('chatContent');
    if (!c) return;

    if (!AUTH.isLoggedIn()) {
      c.innerHTML = renderGuestWarning();
      return;
    }

    let html = '';
    html += renderTabs();
    html += renderContent();
    c.innerHTML = html;
  }

  // ============ هشدار مهمان ============
  function renderGuestWarning() {
    return `
      <div class="chat-empty" style="padding-top:80px;">
        <div class="chat-empty-icon">🔒</div>
        <div class="chat-empty-text">
          برای استفاده از چت و دوستی،<br>
          اول وارد حساب خودت شو
        </div>
        <button onclick="AUTH.showForm('login')" style="margin-top:20px;background:linear-gradient(135deg,#6C5CE7,#0984E3);color:#fff;border:none;padding:12px 28px;border-radius:14px;font-family:inherit;font-weight:bold;font-size:14px;cursor:pointer;">
          ورود / ثبت‌نام
        </button>
      </div>
    `;
  }

  // ============ تب‌ها ============
  function renderTabs() {
    const friendsCount = '👥';
    const searchIcon = '🔍';
    const reqIcon = '📬';

    let html = '<div class="chat-tabs">';
    html += `<div class="chat-tab ${_tab === 'friends' ? 'active' : ''}" onclick="CHAT.setTab('friends')">${friendsCount} دوستان</div>`;
    html += `<div class="chat-tab ${_tab === 'search' ? 'active' : ''}" onclick="CHAT.setTab('search')">${searchIcon} یافتن</div>`;
    html += `<div class="chat-tab ${_tab === 'requests' ? 'active' : ''}" onclick="CHAT.setTab('requests')">${reqIcon} درخواست‌ها <span id="reqBadge" class="badge" style="display:none">0</span></div>`;
    html += '</div>';
    return html;
  }

  // ============ محتوای تب فعال ============
  function renderContent() {
    if (_tab === 'friends') return '<div id="friendsList" class="user-list"><div style="text-align:center;padding:40px;color:#b2bec3;">در حال بارگذاری...</div></div>';
    if (_tab === 'search')  return renderSearchTab();
    if (_tab === 'requests') return '<div id="requestsList" class="user-list"><div style="text-align:center;padding:40px;color:#b2bec3;">در حال بارگذاری...</div></div>';
    return '';
  }

  // ============ تب جستجو ============
  function renderSearchTab() {
    return `
      <div class="chat-search">
        <input id="chatSearchInput" type="text" placeholder="🔍 جستجوی کاربر (نام یا ایمیل)" value="${escapeHtml(_searchQuery)}" oninput="CHAT.onSearchInput(this.value)">
      </div>
      <div id="searchResults" class="user-list">
        <div style="text-align:center;padding:40px;color:#b2bec3;">
          اسم یا ایمیلی که می‌خوای رو بنویس
        </div>
      </div>
    `;
  }

  // ============ تغییر تب ============
  function setTab(tab) {
    _tab = tab;
    render();
    if (tab === 'friends')  loadFriends();
    if (tab === 'requests') loadRequests();
  }

  // ============ جستجو ============
  let _searchTimer = null;
  function onSearchInput(val) {
    _searchQuery = val;
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
      if (val.trim().length < 2) {
        document.getElementById('searchResults').innerHTML =
          '<div style="text-align:center;padding:40px;color:#b2bec3;">حداقل ۲ کاراکتر بنویس</div>';
        return;
      }
      searchUsers(val.trim());
    }, 400);
  }

  // ============ escape ============
  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  return {
    init, render, setTab, onSearchInput
  };
})();
