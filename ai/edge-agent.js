/**
 * Suraya Edge Agent - عامل محلی روی دستگاه کاربر
 * فقط با رضایت؛ قابلیت تطبیق با ابزارهای مجاز دستگاه
 */
'use strict';

class EdgeAgent {
  constructor(opts) {
    opts = opts || {};
    this.agentId = opts.agentId || ('AGENT-' + Date.now());
    this.consent = !!opts.consent;
    this.platform = opts.platform || 'unknown';
    this.capabilities = opts.capabilities || [];
    this.centralUrl = opts.centralUrl || null;
    this.lastPolicy = null;
  }

  setConsent(value) {
    this.consent = !!value;
  }

  detectCapabilities() {
    // در وب/موبایل واقعی: از APIهای مجاز مرورگر/سیستم‌عامل پر می‌شود
    // اینجا فقط اسکلت امن
    var caps = ['network', 'storage_local'];
    if (this.consent) {
      caps.push('notifications_optional');
      caps.push('locale');
      caps.push('accessibility');
    }
    this.capabilities = caps;
    return caps;
  }

  buildInsight() {
    return {
      platform: this.platform,
      capabilities: this.capabilities.slice(),
      usageHint: 'بهبود UX و پایداری',
      at: Date.now()
    };
  }

  async sync(central) {
    if (!central || !central.syncFromAgent) {
      return { ok: false, error: 'no_central' };
    }
    var payload = {
      insight: this.buildInsight(),
      deviceSignals: this.consent ? { platform: this.platform, capabilities: this.capabilities } : null
    };
    var res = central.syncFromAgent(this.agentId, payload);
    if (res && res.policy) this.lastPolicy = res.policy;
    if (res && res.pendingCommands) {
      this.executeCommands(res.pendingCommands);
    }
    return res;
  }

  executeCommands(commands) {
    var self = this;
    (commands || []).forEach(function (cmd) {
      // اجرای امن دستورات مجاز (مثلاً به‌روزرسانی UI قوانین)
      if (cmd.action === 'apply_policy' && cmd.data) {
        self.lastPolicy = Object.assign({}, self.lastPolicy || {}, cmd.data);
      }
      cmd.done = true;
    });
  }
}

module.exports = { EdgeAgent: EdgeAgent };
