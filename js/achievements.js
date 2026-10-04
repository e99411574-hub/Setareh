// js/achievements.js — دستاوردها
const ACHIEVEMENTS = (() => {
  const STORAGE_KEY = 'setareh_achievements';
  const LIST = [
    { id: 'rps_1', icon: '✊', title: 'اولین قدم', desc: 'اولین برد سنگ‌کاغذ‌قیچی', coins: 50, gems: 1, check: s => (s.stats?.rps_wins || 0) >= 1 },
    { id: 'rps_10', icon: '✊', title: 'استاد سنگ', desc: '۱۰ برد سنگ‌کاغذ‌قیچی', coins: 200, gems: 3, check: s => (s.stats?.rps_wins || 0) >= 10 },
    { id: 'rps_50', icon: '🏅', title: 'قهرمان', desc: '۵۰ برد سنگ‌کاغذ‌قیچی', coins: 1000, gems: 10, check: s => (s.stats?.rps_wins || 0) >= 50 },
    { id: 'guess_1', icon: '🔢', title: 'حدس اول', desc: 'اولین برد حدس عدد', coins: 50, gems: 1, check: s => (s.stats?.guess_wins || 0) >= 1 },
    { id: 'guess_10', icon: '🔢', title: 'حدس‌زن', desc: '۱۰ برد حدس عدد', coins: 200, gems: 3, check: s => (s.stats?.guess_wins || 0) >= 10 },
    { id: 'ttt_1', icon: '⭕', title: 'دوز اول', desc: 'اولین برد دوز', coins: 50, gems: 1, check: s => (s.stats?.ttt_wins || 0) >= 1 },
    { id: 'ttt_10', icon: '⭕', title: 'استاد دوز', desc: '۱۰ برد دوز', coins: 200, gems: 3, check: s => (s.stats?.ttt_wins || 0) >= 10 },
    { id: 'mem_1', icon: '🧠', title: 'حافظهٔ خوب', desc: 'اولین برد حافظه', coins: 50, gems: 1, check: s => (s.stats?.memory_wins || 0) >= 1 },
    { id: 'mem_10', icon: '🧠', title: 'فیل حافظه', desc: '۱۰ برد حافظه', coins: 200, gems: 3, check: s => (s.stats?.memory_wins || 0) >= 10 },
    { id: 'coins_100', icon: '🪙', title: 'سکه‌دار', desc: '۱۰۰ سکه جمع کن', coins: 0, gems: 1, check: s => (s.coins || 0) >= 100 },
    { id: 'coins_1000', icon: '🪙', title: 'ثروتمند', desc: '۱۰۰۰ سکه جمع کن', coins: 0, gems: 5, check: s => (s.coins || 0) >= 1000 },
    { id: 'coins_10000', icon: '💰', title: 'گنج‌دار', desc: '۱۰۰۰۰ سکه جمع کن', coins: 0, gems: 20, check: s => (s.coins || 0) >= 10000 },
    { id: 'gems_5', icon: '💎', title: 'جواهر', desc: '۵ جم جمع کن', coins: 100, gems: 0, check: s => (s.gems || 0) >= 5 },
    { id: 'gems_25', icon: '💎', title: 'درخشان', desc: '۲۵ جم جمع کن', coins: 500, gems: 0, check: s => (s.gems || 0) >= 25 },
    { id: 'gems_100', icon: '💠', title: 'الماس', desc: '۱۰۰ جم جمع کن', coins: 2000, gems: 0, check: s => (s.gems || 0) >= 100 },
    { id: 'mission_1', icon: '🏆', title: 'مامور', desc: 'اولین ماموریت کامل کن', coins: 100, gems: 2, check: s => (s.stats?.missions_done || 0) >= 1 },
    { id: 'mission_10', icon: '🏆', title: 'فعال', desc: '۱۰ ماموریت کامل کن', coins: 500, gems: 5, check: s => (s.stats?.missions_done || 0) >= 10 },
    { id: 'mission_50', icon: '🎖️', title: 'سخت‌کوش', desc: '۵۰ ماموریت کامل کن', coins: 2000, gems: 15, check: s => (s.stats?.missions_done || 0) >= 50 },
    { id: 'wheel_10', icon: '🎡', title: 'خوش‌شانس', desc: '۱۰ بار گردونه', coins: 200, gems: 3, check: s => (s.stats?.wheel_spins || 0) >= 10 },
    { id: 'wheel_50', icon: '🎡', title: 'بخت‌یار', desc: '۵۰ بار گردونه', coins: 1000, gems: 10, check: s => (s.stats?.wheel_spins || 0) >= 50 },
    { id: 'poem_10', icon: '📜', title: 'شعرشناس', desc: '۱۰ شعر بخون', coins: 200, gems: 3, check: s => (s.stats?.poems_read || 0) >= 10 },
    { id: 'poem_45', icon: '📚', title: 'ادیب', desc: 'همهٔ ۴۵ شعر', coins: 1500, gems: 20, check: s => (s.stats?.poems_read || 0) >= 45 },
    { id: 'qa_10', icon: '❓', title: 'کنجکاو', desc: '۱۰ سؤال جواب بده', coins: 100, gems: 2, check: s => (s.stats?.qa_answered || 0) >= 10 },
    { id: 'qa_100', icon: '🎓', title: 'دانا', desc: '۱۰۰ سؤال جواب بده', coins: 800, gems: 8, check: s => (s.stats?.qa_answered || 0) >= 100 },
    { id: 'qa_500', icon: '🧑‍🏫', title: 'علامه', desc: '۵۰۰ سؤال جواب بده', coins: 3000, gems: 30, check: s => (s.stats?.qa_answered || 0) >= 500 }
  ];

  function load() {
    try {
      const d = localStorage.getItem(STORAGE_KEY);
      return d ? JSON.parse(d) : { unlocked: {}, claimed: {} };
    } catch { return { unlocked: {}, claimed: {} }; }
  }
  function save(data) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} }

  function checkAll() {
    if (typeof State === 'undefined' || !State.data) return [];
    const data = load();
    const state = State.data;
    const newly = [];
    LIST.forEach(a => {
      if (!data.unlocked[a.id]) {
        try {
          if (a.check(state)) {
            data.unlocked[a.id] = Date.now();
            newly.push(a);
          }
        } catch (e) {}
      }
    });
    if (newly.length > 0) {
      save(data);
      newly.forEach((a, i) => setTimeout(() => showToast(`🏆 ${a.title}!`), i * 1500));
    }
    return newly;
  }

  function claim(id) {
    const a = LIST.find(x => x.id === id);
    if (!a) return;
    const data = load();
    if (!data.unlocked[id]) { showToast('🔒 باز نشده'); return; }
    if (data.claimed[id]) { showToast('✅ قبلاً گرفتی'); return; }
    data.claimed[id] = Date.now();
    save(data);
    if (typeof State !== 'undefined' && State.data) {
      if (a.coins) State.data.coins = (State.data.coins || 0) + a.coins;
      if (a.gems) State.data.gems = (State.data.gems || 0) + a.gems;
      if (typeof State.save === 'function') State.save();
      if (typeof State.emit === 'function') State.emit('change');
    }
    showToast(`🎁 +${a.coins}🪙 +${a.gems}💎`);
    render();
    if (typeof updateHeaderStats === 'function') updateHeaderStats();
  }

  function showToast(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
    else console.log('TOAST:', msg);
  }

  function render() {
    const c = document.getElementById('achievementsList');
    if (!c) return;
    const data = load();
    const done = Object.keys(data.unlocked).length;
    let html = `<div style="background:linear-gradient(135deg,#6C5CE7,#0984E3);color:#fff;padding:20px;border-radius:16px;margin-bottom:16px;text-align:center;">
      <div style="font-size:42px;">🏆</div>
      <div style="font-size:20px;font-weight:bold;margin-top:8px;">دستاوردها</div>
      <div style="opacity:.9;margin-top:6px;">${done} از ${LIST.length}</div>
      <div style="background:rgba(255,255,255,.25);height:8px;border-radius:4px;margin-top:12px;overflow:hidden;">
        <div style="background:#FDCB6E;height:100%;width:${(done / LIST.length) * 100}%;transition:width .5s;"></div>
      </div></div>`;
    LIST.forEach(a => {
      const u = !!data.unlocked[a.id];
      const cl = !!data.claimed[a.id];
      html += `<div style="display:flex;align-items:center;gap:12px;padding:14px;margin:8px 0;background:${u ? '#fff' : '#f0f0f5'};border-radius:14px;${u ? 'box-shadow:0 2px 8px rgba(108,92,231,.15);' : 'opacity:.65;'}border-right:4px solid ${u ? '#FDCB6E' : '#ddd'};">
        <div style="font-size:32px;${!u ? 'filter:grayscale(1);opacity:.5;' : ''}">${a.icon}</div>
        <div style="flex:1;">
          <div style="font-weight:bold;color:#2d3436;">${a.title}</div>
          <div style="font-size:12px;color:#636e72;margin-top:4px;">${a.desc}</div>
          ${u ? `<div style="font-size:11px;color:#00b894;margin-top:4px;">${cl ? '✅ دریافت شد' : '🎁 آماده'}</div>` : '<div style="font-size:11px;color:#b2bec3;margin-top:4px;">🔒 قفل</div>'}
        </div>
        <div style="text-align:center;">
          <div style="font-size:12px;color:#f39c12;font-weight:bold;">+${a.coins}🪙</div>
          <div style="font-size:12px;color:#0984E3;font-weight:bold;">+${a.gems}💎</div>
          ${u && !cl ? `<button onclick="ACHIEVEMENTS.claim('${a.id}')" style="margin-top:6px;padding:6px 12px;background:#00b894;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">دریافت</button>` : ''}
        </div></div>`;
    });
    c.innerHTML = html;
  }

  function init() {
    console.log('🏆 ACHIEVEMENTS.init');
    setInterval(checkAll, 10000);
    setTimeout(checkAll, 1500);
  }

  return { init, render, checkAll, claim, LIST };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => ACHIEVEMENTS.init(), 800));
} else {
  setTimeout(() => ACHIEVEMENTS.init(), 800);
}
console.log('🏆 ACHIEVEMENTS: لود شد');
