// ===== js/chat.js — چت، دوستان، ویس، عکس =====

const CHAT = (() => {

  let _tab = 'friends';
  let _searchQuery = '';
  let _currentRoom = null;
  let _messages = [];
  let _refreshTimer = null;
  let _mediaRecorder = null;
  let _audioChunks = [];
  let _recordingStart = 0;
  let _currentAudio = null;
  let _currentBtn = null;

  function init() {
    console.log('💬 CHAT: آماده');
  }

  function render() {
    const c = document.getElementById('chatContent');
    if (!c) return;
    if (!AUTH.isLoggedIn()) { c.innerHTML = renderGuestWarning(); return; }
    let html = '';
    html += renderTabs();
    html += renderContent();
    c.innerHTML = html;
    setTimeout(() => {
      if (_tab === 'friends') loadFriends();
      if (_tab === 'requests') loadRequests();
      if (_tab === 'blocked') loadBlocked();
    }, 100);
  }

  function renderGuestWarning() {
    return `
      <div class="chat-empty" style="padding-top:80px;">
        <div class="chat-empty-icon">🔒</div>
        <div class="chat-empty-text">برای استفاده از چت و دوستی،<br>اول وارد حساب خودت شو</div>
        <button onclick="AUTH.showForm('login')" style="margin-top:20px;background:linear-gradient(135deg,#6C5CE7,#0984E3);color:#fff;border:none;padding:12px 28px;border-radius:14px;font-family:inherit;font-weight:bold;font-size:14px;cursor:pointer;">ورود / ثبت‌نام</button>
      </div>
    `;
  }

  function renderTabs() {
    let html = '<div class="chat-tabs">';
    html += `<div class="chat-tab ${_tab === 'friends' ? 'active' : ''}" onclick="CHAT.setTab('friends')">👥 دوستان</div>`;
    html += `<div class="chat-tab ${_tab === 'search' ? 'active' : ''}" onclick="CHAT.setTab('search')">🔍 یافتن</div>`;
    html += `<div class="chat-tab ${_tab === 'requests' ? 'active' : ''}" onclick="CHAT.setTab('requests')">📬 درخواست‌ها <span id="reqBadge" class="badge" style="display:none">0</span></div>`;
    html += `<div class="chat-tab ${_tab === 'blocked' ? 'active' : ''}" onclick="CHAT.setTab('blocked')">🚫 بلاک‌ها</div>`;
    html += '</div>';
    return html;
  }

  function renderContent() {
    if (_tab === 'friends') return '<div id="friendsList" class="user-list"><div style="text-align:center;padding:40px;color:#b2bec3;">در حال بارگذاری...</div></div>';
    if (_tab === 'search') return renderSearchTab();
    if (_tab === 'requests') return '<div id="requestsList" class="user-list"><div style="text-align:center;padding:40px;color:#b2bec3;">در حال بارگذاری...</div></div>';
    if (_tab === 'blocked') return '<div id="blockedList" class="user-list"><div style="text-align:center;padding:40px;color:#b2bec3;">در حال بارگذاری...</div></div>';
    return '';
  }

  function renderSearchTab() {
    return `
      <div class="chat-search">
        <input id="chatSearchInput" type="text" placeholder="🔍 جستجوی کاربر (نام یا ایمیل)" value="${escapeHtml(_searchQuery)}" oninput="CHAT.onSearchInput(this.value)">
      </div>
      <div id="searchResults" class="user-list">
        <div style="text-align:center;padding:40px;color:#b2bec3;">اسم یا ایمیلی که می‌خوای رو بنویس</div>
      </div>
    `;
  }

  function setTab(tab) { _tab = tab; render(); }

  let _searchTimer = null;
  function onSearchInput(val) {
    _searchQuery = val;
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
      if (val.trim().length < 2) {
        const el = document.getElementById('searchResults');
        if (el) el.innerHTML = '<div style="text-align:center;padding:40px;color:#b2bec3;">حداقل ۲ کاراکتر بنویس</div>';
        return;
      }
      searchUsers(val.trim());
    }, 400);
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  // ============ لود دوستان ============
  async function loadFriends() {
    const box = document.getElementById('friendsList');
    if (!box) return;
    const me = SB.getUser();
    if (!me) return;
    try {
      const res = await SB.from('friendships').select('*').eq('status', 'accepted');
      const all = (res.data || []).filter(f => f.user_id === me.id || f.friend_id === me.id);
      if (!all.length) {
        box.innerHTML = `<div class="chat-empty"><div class="chat-empty-icon">👥</div><div class="chat-empty-text">هنوز دوستی نداری!<br>برو تب <b>یافتن</b> و دوست پیدا کن</div></div>`;
        return;
      }
      const friendIds = all.map(f => f.user_id === me.id ? f.friend_id : f.user_id);
      const uRes = await SB.from('users').select('*');
      const users = (uRes.data || []).filter(u => friendIds.includes(u.id));
      let html = '';
      users.forEach(u => {
        const f = all.find(x =>
          (x.user_id === me.id && x.friend_id === u.id) ||
          (x.friend_id === me.id && x.user_id === u.id)
        );
        html += renderFriendCard(u, f);
      });
      box.innerHTML = html;
    } catch (err) {
      console.warn('loadFriends error:', err);
      box.innerHTML = '<div class="chat-empty">خطا در بارگذاری</div>';
    }
  }

  function renderFriendCard(user, friendship) {
    const name = escapeHtml(user.display_name || 'کاربر');
    const bio = escapeHtml(user.bio || 'بدون بیو');
    const avatar = renderAvatar(user);
    return `<div class="user-card" onclick="CHAT.openRoom('${user.id}')">
      <div class="user-card-avatar">${avatar}</div>
      <div class="user-card-info">
        <div class="user-card-name">${name}</div>
        <div class="user-card-bio">${bio}</div>
      </div>
      <div class="user-card-action" onclick="event.stopPropagation()">
        <button class="btn-icon" onclick="CHAT.showUserMenu('${user.id}', '${friendship.id}')">⋮</button>
      </div>
    </div>`;
  }

  function renderAvatar(user) {
    if (user.avatar === 'custom' && user.avatar_url) {
      return `<img src="${escapeHtml(user.avatar_url)}" alt="">`;
    }
    if (user.avatar === 'female') return '👩';
    return '👨';
  }

  async function searchUsers(query) {
    const box = document.getElementById('searchResults');
    if (!box) return;
    const me = SB.getUser();
    if (!me) return;
    box.innerHTML = '<div style="text-align:center;padding:40px;color:#b2bec3;">🔍 در حال جستجو...</div>';
    try {
      const res = await SB.from('users').select('*');
      const all = res.data || [];
      const q = query.toLowerCase();
      const filtered = all.filter(u => {
        if (u.id === me.id) return false;
        const name = (u.display_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
      if (!filtered.length) {
        box.innerHTML = `<div class="chat-empty"><div class="chat-empty-icon">🔍</div><div class="chat-empty-text">کاربری با این مشخصات پیدا نشد</div></div>`;
        return;
      }
      const fRes = await SB.from('friendships').select('*');
      const friendships = (fRes.data || []).filter(f => f.user_id === me.id || f.friend_id === me.id);
      let html = '';
      filtered.forEach(u => {
        const rel = friendships.find(f =>
          (f.user_id === me.id && f.friend_id === u.id) ||
          (f.friend_id === me.id && f.user_id === u.id)
        );
        html += renderSearchCard(u, rel);
      });
      box.innerHTML = html;
    } catch (err) {
      console.warn('searchUsers error:', err);
      box.innerHTML = '<div class="chat-empty">خطا در جستجو</div>';
    }
  }

  function renderSearchCard(user, rel) {
    const name = escapeHtml(user.display_name || 'کاربر');
    const bio = escapeHtml(user.bio || 'بدون بیو');
    const avatar = renderAvatar(user);
    let actionHtml = '';
    if (!rel) {
      actionHtml = `<button class="btn-add-friend" onclick="CHAT.sendRequest('${user.id}')">افزودن</button>`;
    } else if (rel.status === 'pending') {
      if (rel.user_id === SB.getUser().id) {
        actionHtml = `<button class="btn-add-friend btn-pending" disabled>در انتظار</button>`;
      } else {
        actionHtml = `<button class="btn-add-friend btn-accept" onclick="CHAT.acceptRequest('${rel.id}')">قبول</button>`;
      }
    } else if (rel.status === 'accepted') {
      actionHtml = `<button class="btn-add-friend btn-friend" disabled>✓ دوست</button>`;
    } else if (rel.status === 'blocked') {
      actionHtml = `<button class="btn-add-friend" disabled>بلاک</button>`;
    }
    return `<div class="user-card">
      <div class="user-card-avatar">${avatar}</div>
      <div class="user-card-info">
        <div class="user-card-name">${name}</div>
        <div class="user-card-bio">${bio}</div>
      </div>
      <div class="user-card-action">${actionHtml}</div>
    </div>`;
  }

  async function sendRequest(userId) {
    const me = SB.getUser();
    if (!me) return;
    try {
      await SB.insert('friendships', { user_id: me.id, friend_id: userId, status: 'pending' });
      showToast('✅ درخواست دوستی فرستاده شد');
      if (typeof playSnd === 'function') playSnd('success');
      searchUsers(_searchQuery);
    } catch (err) {
      console.warn('sendRequest error:', err);
      showToast('❌ خطا در ارسال درخواست');
    }
  }

  async function acceptRequest(friendshipId) {
    try {
      await SB.update('friendships', { status: 'accepted' }, { id: friendshipId });
      showToast('✅ درخواست قبول شد');
      if (typeof playSnd === 'function') playSnd('success');
      searchUsers(_searchQuery);
      loadRequests();
    } catch (err) {
      console.warn('acceptRequest error:', err);
      showToast('❌ خطا در قبول درخواست');
    }
  }

  async function loadRequests() {
    const box = document.getElementById('requestsList');
    if (!box) return;
    const me = SB.getUser();
    if (!me) return;
    try {
      const res = await SB.from('friendships').select('*').eq('status', 'pending');
      const incoming = (res.data || []).filter(f => f.friend_id === me.id);
      const badge = document.getElementById('reqBadge');
      if (badge) {
        if (incoming.length > 0) { badge.textContent = incoming.length; badge.style.display = 'inline-block'; }
        else { badge.style.display = 'none'; }
      }
      if (!incoming.length) {
        box.innerHTML = `<div class="chat-empty"><div class="chat-empty-icon">📬</div><div class="chat-empty-text">درخواست دوستی جدیدی نداری</div></div>`;
        return;
      }
      const senderIds = incoming.map(f => f.user_id);
      const uRes = await SB.from('users').select('*');
      const users = (uRes.data || []).filter(u => senderIds.includes(u.id));
      let html = '';
      users.forEach(u => {
        const req = incoming.find(f => f.user_id === u.id);
        html += renderRequestCard(u, req);
      });
      box.innerHTML = html;
    } catch (err) {
      console.warn('loadRequests error:', err);
      box.innerHTML = '<div class="chat-empty">خطا در بارگذاری</div>';
    }
  }

  function renderRequestCard(user, req) {
    const name = escapeHtml(user.display_name || 'کاربر');
    const avatar = renderAvatar(user);
    return `<div class="user-card">
      <div class="user-card-avatar">${avatar}</div>
      <div class="user-card-info">
        <div class="user-card-name">${name}</div>
        <div class="user-card-bio">درخواست دوستی فرستاده</div>
      </div>
      <div class="user-card-action">
        <button class="btn-icon primary" onclick="CHAT.acceptRequest('${req.id}')" title="قبول">✓</button>
        <button class="btn-icon danger" onclick="CHAT.rejectRequest('${req.id}')" title="رد">✕</button>
      </div>
    </div>`;
  }

  async function rejectRequest(friendshipId) {
    try {
      await SB.delete('friendships', { id: friendshipId });
      showToast('درخواست رد شد');
      loadRequests();
    } catch (err) {
      console.warn('rejectRequest error:', err);
    }
  }

  async function loadBlocked() {
    const box = document.getElementById('blockedList');
    if (!box) return;
    const me = SB.getUser();
    if (!me) return;
    try {
      const res = await SB.from('friendships').select('*').eq('status', 'blocked');
      const blocked = (res.data || []).filter(f => f.user_id === me.id || f.friend_id === me.id);
      if (!blocked.length) {
        box.innerHTML = `<div class="chat-empty"><div class="chat-empty-icon">🚫</div><div class="chat-empty-text">کسی رو بلاک نکردی</div></div>`;
        return;
      }
      const otherIds = blocked.map(f => f.user_id === me.id ? f.friend_id : f.user_id);
      const uRes = await SB.from('users').select('*');
      const users = (uRes.data || []).filter(u => otherIds.includes(u.id));
      let html = '';
      users.forEach(u => {
        const f = blocked.find(x =>
          (x.user_id === me.id && x.friend_id === u.id) ||
          (x.friend_id === me.id && x.user_id === u.id)
        );
        html += renderBlockedCard(u, f, me);
      });
      box.innerHTML = html;
    } catch (err) {
      console.warn('loadBlocked error:', err);
      box.innerHTML = '<div class="chat-empty">خطا در بارگذاری</div>';
    }
  }

  function renderBlockedCard(user, friendship, me) {
    const name = escapeHtml(user.display_name || 'کاربر');
    const avatar = renderAvatar(user);
    const iBlocked = friendship.user_id === me.id;
    return `<div class="user-card">
      <div class="user-card-avatar">${avatar}</div>
      <div class="user-card-info">
        <div class="user-card-name">${name}</div>
        <div class="user-card-bio">${iBlocked ? 'تو بلاکش کردی' : 'تو رو بلاک کرده'}</div>
      </div>
      <div class="user-card-action">
        ${iBlocked ? `<button class="btn-add-friend btn-accept" onclick="CHAT.unblockUser('${friendship.id}')">رفع بلاک</button>` : ''}
      </div>
    </div>`;
  }

  async function unblockUser(friendshipId) {
    if (!confirm('مطمئنی می‌خوای این کاربر رو از بلاک دربیاری؟')) return;
    try {
      await SB.update('friendships', { status: 'accepted', blocked_by: null }, { id: friendshipId });
      showToast('✅ بلاک برداشته شد');
      if (typeof playSnd === 'function') playSnd('success');
      loadBlocked();
      loadFriends();
    } catch (err) {
      console.warn('unblockUser error:', err);
      showToast('❌ خطا در رفع بلاک');
    }
  }

  function showUserMenu(userId, friendshipId) {
    const overlay = document.createElement('div');
    overlay.className = 'user-menu-popup';
    overlay.id = 'userMenuPopup';
    overlay.onclick = (e) => { if (e.target === overlay) closeUserMenu(); };
    overlay.innerHTML = `
      <div class="user-menu-box">
        <div class="user-menu-item" onclick="CHAT.clearHistory('${userId}'); CHAT.closeUserMenu();"><span>🗑️</span><span>پاک کردن تاریخچهٔ چت</span></div>
        <div class="user-menu-item warn" onclick="CHAT.blockUser('${friendshipId}', '${userId}'); CHAT.closeUserMenu();"><span>🚫</span><span>بلاک کردن</span></div>
        <div class="user-menu-item danger" onclick="CHAT.removeFriend('${friendshipId}'); CHAT.closeUserMenu();"><span>❌</span><span>حذف از دوستان</span></div>
        <div class="user-menu-item user-menu-cancel" onclick="CHAT.closeUserMenu()"><span>انصراف</span></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function closeUserMenu() {
    const el = document.getElementById('userMenuPopup');
    if (el) el.remove();
  }

  async function removeFriend(friendshipId) {
    if (!confirm('مطمئنی می‌خوای این دوست رو حذف کنی؟')) return;
    try {
      await SB.delete('friendships', { id: friendshipId });
      showToast('✅ دوست حذف شد');
      loadFriends();
    } catch (err) {
      console.warn('removeFriend error:', err);
      showToast('❌ خطا در حذف');
    }
  }

  async function blockUser(friendshipId, userId) {
    if (!confirm('مطمئنی می‌خوای این کاربر رو بلاک کنی؟')) return;
    try {
      const me = SB.getUser();
      await SB.update('friendships', { status: 'blocked', blocked_by: me.id }, { id: friendshipId });
      showToast('🚫 کاربر بلاک شد');
      loadFriends();
      loadBlocked();
    } catch (err) {
      console.warn('blockUser error:', err);
      showToast('❌ خطا در بلاک');
    }
  }

  async function clearHistory(userId) {
    if (!confirm('مطمئنی می‌خوای تمام پیام‌ها رو پاک کنی؟')) return;
    try {
      const me = SB.getUser();
      const res = await SB.from('messages').select('*');
      const toDelete = (res.data || []).filter(m =>
        (m.sender_id === me.id && m.receiver_id === userId) ||
        (m.receiver_id === me.id && m.sender_id === userId)
      );
      for (const m of toDelete) { await SB.delete('messages', { id: m.id }); }
      showToast('🗑️ تاریخچه پاک شد');
    } catch (err) {
      console.warn('clearHistory error:', err);
      showToast('❌ خطا در پاک کردن');
    }
  }

  async function openRoom(userId) {
    const me = SB.getUser();
    if (!me) return;
    const res = await SB.from('users').select('*').eq('id', userId);
    const user = (res.data || [])[0];
    if (!user) return;
    _currentRoom = user;
    _messages = [];
    const room = document.createElement('div');
    room.className = 'chat-room';
    room.id = 'chatRoom';
    room.innerHTML = `
      <div class="chat-room-header">
        <button class="chat-room-back" onclick="CHAT.closeRoom()">‹</button>
        <div class="chat-room-name">${escapeHtml(user.display_name || 'کاربر')}</div>
        <div class="chat-room-actions">
          <button class="chat-room-action" onclick="CHAT.showGiftMenu()" title="ارسال سکه/الماس">💰</button>
          <button class="chat-room-action" onclick="CHAT.showGameMenu()" title="بازی با دوست">🎮</button>
        </div>
      </div>
      <div class="chat-room-messages" id="chatMessages">
        <div style="text-align:center;padding:20px;color:#b2bec3;font-size:13px;">در حال بارگذاری...</div>
      </div>
      <div class="chat-room-input" id="chatInputBar">
        <button class="chat-room-btn" onclick="document.getElementById('chatImageInput').click()">📷</button>
        <input type="file" id="chatImageInput" accept="image/*" style="display:none" onchange="CHAT.sendImage(event)">
        <input type="text" id="chatTextInput" placeholder="پیام بنویس..." onkeydown="if(event.key==='Enter')CHAT.sendMessage()">
        <button class="chat-room-btn" onclick="CHAT.toggleRecord()" id="chatVoiceBtn">🎤</button>
        <button class="chat-room-btn chat-room-send" onclick="CHAT.sendMessage()">➤</button>
      </div>
    `;
    document.body.appendChild(room);
    loadMessages();
    _refreshTimer = setInterval(loadMessages, 5000);
  }

  function closeRoom() {
    clearInterval(_refreshTimer);
    _refreshTimer = null;
    _currentRoom = null;
    _messages = [];
    if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; _currentBtn = null; }
    const el = document.getElementById('chatRoom');
    if (el) el.remove();
  }

  async function loadMessages() {
    if (!_currentRoom) return;
    const me = SB.getUser();
    if (!me) return;
    const box = document.getElementById('chatMessages');
    if (!box) return;
    try {
      const res = await SB.from('messages').select('*');
      const all = (res.data || []).filter(m =>
        (m.sender_id === me.id && m.receiver_id === _currentRoom.id) ||
        (m.receiver_id === me.id && m.sender_id === _currentRoom.id)
      );
      all.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      _messages = all;
      let html = '';
      if (!all.length) {
        html = '<div style="text-align:center;padding:30px;color:#b2bec3;font-size:13px;">شروع گفتگو کن! 👋</div>';
      } else {
        all.forEach(m => { html += renderMessage(m, me.id); });
      }
      // فقط اگه محتوا عوض شده، آپدیت کن (جلوگیری از سفید شدن)
      if (box.getAttribute('data-last') !== html) {
        box.setAttribute('data-last', html);
        box.innerHTML = html;
        box.scrollTop = box.scrollHeight;
        loadVoiceDurations();
      }
    } catch (err) {
      console.warn('loadMessages error:', err);
    }
  }

  function renderMessage(msg, myId) {
    const isMe = msg.sender_id === myId;
    const cls = isMe ? 'chat-msg-me' : 'chat-msg-other';
    const time = formatTime(msg.created_at);
    if (msg.type === 'image' && msg.media_url) {
      return `<div class="chat-msg chat-msg-image ${cls}">
        <img src="${escapeHtml(msg.media_url)}" onclick="window.open('${escapeHtml(msg.media_url)}','_blank')">
        <div class="chat-msg-time" style="${isMe ? 'color:#fff' : ''}">${time}</div>
      </div>`;
    }
    if (msg.type === 'audio' && msg.media_url) {
      return `<div class="chat-msg chat-msg-voice ${cls}">
        <button class="voice-play-btn" onclick="CHAT.playVoice(this, '${escapeHtml(msg.media_url)}')">▶</button>
        <div class="voice-wave"><span></span><span></span><span></span><span></span><span></span></div>
        <span class="voice-dur" data-url="${escapeHtml(msg.media_url)}" style="font-size:11px;opacity:.8;min-width:32px;">۰:۰۰</span>
        <div style="font-size:10px;opacity:.7;">${time}</div>
      </div>`;
    }
    if (msg.type === 'gift') {
      return `<div class="chat-msg ${cls}" style="background:linear-gradient(135deg,#FDCB6E,#E67E22);color:#fff;font-weight:bold;">
        🎁 ${escapeHtml(msg.text || '')}
        <div class="chat-msg-time" style="color:#fff">${time}</div>
      </div>`;
    }
    if (msg.type === 'game_invite') {
      return `<div class="chat-msg ${cls}" style="background:linear-gradient(135deg,#6C5CE7,#0984E3);color:#fff;font-weight:bold;">
        🎮 ${escapeHtml(msg.text || '')}
        <div class="chat-msg-time" style="color:#fff">${time}</div>
      </div>`;
    }
    return `<div class="chat-msg ${cls}">
      ${escapeHtml(msg.text || '')}
      <div class="chat-msg-time">${time}</div>
    </div>`;
  }

  function formatTime(iso) {
    try {
      const d = new Date(iso);
      return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    } catch (e) { return ''; }
  }

  async function sendMessage() {
    if (!_currentRoom) return;
    const me = SB.getUser();
    if (!me) return;
    const input = document.getElementById('chatTextInput');
    const text = (input.value || '').trim();
    if (!text) return;
    input.value = '';
    try {
      await SB.insert('messages', {
        sender_id: me.id,
        receiver_id: _currentRoom.id,
        text: text,
        type: 'text'
      });
      loadMessages();
    } catch (err) {
      console.warn('sendMessage error:', err);
      showToast('❌ خطا در ارسال');
    }
  }

  async function sendImage(evt) {
    const file = evt.target.files[0];
    if (!file || !_currentRoom) return;
    const me = SB.getUser();
    if (!me) return;
    if (file.size > 5 * 1024 * 1024) { showToast('❌ عکس باید کمتر از ۵ مگابایت باشه'); return; }
    showToast('⏳ در حال آپلود...');
    try {
      const url = await uploadFile(file, 'img');
      await SB.insert('messages', {
        sender_id: me.id,
        receiver_id: _currentRoom.id,
        text: '',
        type: 'image',
        media_url: url
      });
      loadMessages();
    } catch (err) {
      console.warn('sendImage error:', err);
      showToast('❌ خطا در آپلود عکس');
    }
  }

  async function uploadFile(file, prefix) {
    const ext = (file.name || 'file.bin').split('.').pop() || 'bin';
    const name = prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    const url = SUPABASE_URL + '/storage/v1/object/chat-media/' + name;
    const token = SB.getSession() ? SB.getSession().access_token : SUPABASE_KEY;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + token,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: file
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error('upload failed: ' + errText);
    }
    return SUPABASE_URL + '/storage/v1/object/public/chat-media/' + name;
  }

  async function toggleRecord() {
    if (_mediaRecorder && _mediaRecorder.state === 'recording') {
      _mediaRecorder.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      _audioChunks = [];
      _mediaRecorder = new MediaRecorder(stream);
      _recordingStart = Date.now();
      _mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) _audioChunks.push(e.data); };
      _mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(_audioChunks, { type: 'audio/webm' });
        await sendVoice(blob);
        resetRecordUI();
      };
      _mediaRecorder.start();
      showRecordingUI();
    } catch (err) {
      console.warn('record error:', err);
      showToast('❌ دسترسی به میکروفون داده نشد');
    }
  }

  function showRecordingUI() {
    const bar = document.getElementById('chatInputBar');
    if (!bar) return;
    bar.classList.add('recording');
    bar.innerHTML = `<div class="recording-indicator"><span class="recording-dot"></span><span>در حال ضبط... برای توقف بزن</span></div><button class="chat-room-btn chat-room-send" onclick="CHAT.toggleRecord()">⏹</button>`;
  }

  function resetRecordUI() {
    const bar = document.getElementById('chatInputBar');
    if (!bar) return;
    bar.classList.remove('recording');
    bar.innerHTML = `
      <button class="chat-room-btn" onclick="document.getElementById('chatImageInput').click()">📷</button>
      <input type="file" id="chatImageInput" accept="image/*" style="display:none" onchange="CHAT.sendImage(event)">
      <input type="text" id="chatTextInput" placeholder="پیام بنویس..." onkeydown="if(event.key==='Enter')CHAT.sendMessage()">
      <button class="chat-room-btn" onclick="CHAT.toggleRecord()" id="chatVoiceBtn">🎤</button>
      <button class="chat-room-btn chat-room-send" onclick="CHAT.sendMessage()">➤</button>
    `;
  }

  async function sendVoice(blob) {
    if (!_currentRoom) return;
    const me = SB.getUser();
    if (!me) return;
    showToast('⏳ در حال ارسال ویس...');
    try {
      const file = new File([blob], 'voice.webm', { type: 'audio/webm' });
      const url = await uploadFile(file, 'voice');
      await SB.insert('messages', {
        sender_id: me.id,
        receiver_id: _currentRoom.id,
        text: '',
        type: 'audio',
        media_url: url
      });
      loadMessages();
    } catch (err) {
      console.warn('sendVoice error:', err);
      showToast('❌ خطا در ارسال ویس');
    }
  }

  function playVoice(btn, url) {
    if (_currentAudio && _currentBtn === btn && !_currentAudio.paused) {
      _currentAudio.pause();
      btn.textContent = '▶';
      return;
    }
    if (_currentAudio) {
      _currentAudio.pause();
      if (_currentBtn) _currentBtn.textContent = '▶';
    }
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    _currentAudio = audio;
    _currentBtn = btn;
    btn.textContent = '⏳';
    audio.oncanplay = () => {
      btn.textContent = '⏸';
      audio.play().catch(err => {
        console.warn('play error:', err);
        btn.textContent = '▶';
        showToast('❌ خطا در پخش ویس');
      });
    };
    audio.onended = () => { btn.textContent = '▶'; _currentAudio = null; _currentBtn = null; };
    audio.onerror = (e) => {
      console.warn('audio error:', e);
      btn.textContent = '▶';
      showToast('❌ فرمت ویس پشتیبانی نمیشه');
    };
    audio.load();
  }

  function loadVoiceDurations() {
    const els = document.querySelectorAll('.voice-dur');
    els.forEach(el => {
      const url = el.getAttribute('data-url');
      if (!url || el.getAttribute('data-loaded') === '1') return;
      el.setAttribute('data-loaded', '1');
      const a = new Audio();
      a.preload = 'metadata';
      a.src = url;
      a.onloadedmetadata = () => {
        const dur = a.duration;
        if (isFinite(dur) && dur > 0) {
          const m = Math.floor(dur / 60);
          const s = Math.floor(dur % 60);
          const faS = s < 10 ? '۰' + toFa(s) : toFa(s);
          el.textContent = toFa(m) + ':' + faS;
        } else {
          el.textContent = '—';
        }
      };
      a.onerror = () => { el.textContent = '—'; };
    });
  }

  function toFa(n) {
    const fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(n).replace(/\d/g, d => fa[+d]);
  }

  function showGiftMenu() {
    const overlay = document.createElement('div');
    overlay.className = 'user-menu-popup';
    overlay.id = 'giftMenu';
    overlay.onclick = (e) => { if (e.target === overlay) closeGiftMenu(); };
    overlay.innerHTML = `
      <div class="user-menu-box">
        <div style="text-align:center;padding:12px;font-weight:bold;color:#6C5CE7;">💰 ارسال هدیه</div>
        <div class="user-menu-item" onclick="CHAT.sendGift('coin', 10); CHAT.closeGiftMenu();">
          <span>🪙</span><span>۱۰ سکه</span>
        </div>
        <div class="user-menu-item" onclick="CHAT.sendGift('coin', 50); CHAT.closeGiftMenu();">
          <span>🪙</span><span>۵۰ سکه</span>
        </div>
        <div class="user-menu-item" onclick="CHAT.sendGift('gem', 1); CHAT.closeGiftMenu();">
          <span>💎</span><span>۱ الماس</span>
        </div>
        <div class="user-menu-item" onclick="CHAT.sendGift('gem', 5); CHAT.closeGiftMenu();">
          <span>💎</span><span>۵ الماس</span>
        </div>
        <div class="user-menu-item user-menu-cancel" onclick="CHAT.closeGiftMenu()">
          <span>انصراف</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function closeGiftMenu() {
    const el = document.getElementById('giftMenu');
    if (el) el.remove();
  }

  async function sendGift(type, amount) {
    if (!_currentRoom) return;
    const me = SB.getUser();
    if (!me) return;
    const user = STATE.getUser();
    if (type === 'coin' && (user.coins || 0) < amount) {
      showToast('❌ سکه کافی نداری');
      return;
    }
    if (type === 'gem' && (user.gems || 0) < amount) {
      showToast('❌ الماس کافی نداری');
      return;
    }
    try {
      if (type === 'coin') {
        user.coins = (user.coins || 0) - amount;
      } else {
        user.gems = (user.gems || 0) - amount;
      }
      STATE.saveUser(user);
      if (typeof APP !== 'undefined' && APP.updateHeader) APP.updateHeader();

      const text = type === 'coin'
        ? `${amount} سکه فرستاد 🪙`
        : `${amount} الماس فرستاد 💎`;
      await SB.insert('messages', {
        sender_id: me.id,
        receiver_id: _currentRoom.id,
        text: text,
        type: 'gift'
      });
      showToast('🎁 هدیه فرستاده شد');
      if (typeof playSnd === 'function') playSnd('success');
      loadMessages();
    } catch (err) {
      console.warn('sendGift error:', err);
      showToast('❌ خطا در ارسال هدیه');
    }
  }

  function showGameMenu() {
    const overlay = document.createElement('div');
    overlay.className = 'user-menu-popup';
    overlay.id = 'gameMenu';
    overlay.onclick = (e) => { if (e.target === overlay) closeGameMenu(); };
    overlay.innerHTML = `
      <div class="user-menu-box">
        <div style="text-align:center;padding:12px;font-weight:bold;color:#6C5CE7;">🎮 بازی با دوست</div>
        <div class="user-menu-item" onclick="CHAT.sendGameInvite('سنگ کاغذ قیچی'); CHAT.closeGameMenu();">
          <span>✊</span><span>سنگ کاغذ قیچی</span>
        </div>
        <div class="user-menu-item" onclick="CHAT.sendGameInvite('حدس عدد'); CHAT.closeGameMenu();">
          <span>🔢</span><span>حدس عدد</span>
        </div>
        <div class="user-menu-item" onclick="CHAT.sendGameInvite('دوز'); CHAT.closeGameMenu();">
          <span>❌</span><span>دوز</span>
        </div>
        <div class="user-menu-item" onclick="CHAT.sendGameInvite('حافظه'); CHAT.closeGameMenu();">
          <span>🃏</span><span>حافظه</span>
        </div>
        <div class="user-menu-item user-menu-cancel" onclick="CHAT.closeGameMenu()">
          <span>انصراف</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function closeGameMenu() {
    const el = document.getElementById('gameMenu');
    if (el) el.remove();
  }

  async function sendGameInvite(gameName) {
    if (!_currentRoom) return;
    const me = SB.getUser();
    if (!me) return;
    try {
      await SB.insert('messages', {
        sender_id: me.id,
        receiver_id: _currentRoom.id,
        text: `دعوت به بازی ${gameName}`,
        type: 'game_invite'
      });
      showToast('🎮 دعوت فرستاده شد');
      if (typeof playSnd === 'function') playSnd('click');
      loadMessages();
    } catch (err) {
      console.warn('sendGameInvite error:', err);
      showToast('❌ خطا در ارسال دعوت');
    }
  }

  return {
    init, render, setTab, onSearchInput,
    loadFriends, searchUsers, sendRequest, acceptRequest, rejectRequest,
    loadRequests, loadBlocked, renderAvatar, escapeHtml,
    showUserMenu, closeUserMenu, removeFriend, blockUser, unblockUser,
    clearHistory, openRoom, closeRoom, loadMessages, sendMessage, sendImage,
    toggleRecord, sendVoice, playVoice, loadVoiceDurations,
    showGiftMenu, closeGiftMenu, sendGift,
    showGameMenu, closeGameMenu, sendGameInvite
  };
})();
