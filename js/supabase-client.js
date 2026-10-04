// ===== supabase-client.js - اتصال به Supabase =====

// ⚠️ این دو مقدار رو از یادداشت گوشیت کپی کن
var SUPABASE_URL = 'https://qsibyylhwfadlyoqlemt.supabase.co';
var SUPABASE_KEY = 'REPLACE_WITH_YOUR_PUBLISHABLE_KEY';

// ============ راه‌اندازی کلاینت ============
var supabase = null;

var SB = {
  // ============ اتصال ============
  init: function() {
    // اگه قبلاً وصل شده، نکن
    if (supabase) return supabase;

    // بررسی کتابخانه
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.warn('⚠️ Supabase library not loaded yet');
      return null;
    }

    // بررسی کلید
    if (!SUPABASE_KEY || SUPABASE_KEY.indexOf('REPLACE') >= 0) {
      console.error('❌ Supabase key not set! Edit js/supabase-client.js');
      return null;
    }

    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('✅ Supabase connected');
      return supabase;
    } catch (e) {
      console.error('❌ Supabase connection error:', e);
      return null;
    }
  },

  // ============ بررسی اتصال ============
  isReady: function() {
    return supabase !== null;
  },

  // ============ گرفتن کلاینت ============
  get: function() {
    if (!supabase) this.init();
    return supabase;
  },

  // ============ تست اتصال ============
  testConnection: function() {
    var client = this.get();
    if (!client) {
      return Promise.reject(new Error('Supabase not connected'));
    }
    // یه درخواست ساده به auth
    return client.auth.getSession()
      .then(function(res) {
        console.log('✅ Supabase test success:', res);
        return true;
      })
      .catch(function(err) {
        console.error('❌ Supabase test failed:', err);
        throw err;
      });
  }
};

window.SB = SB;
