/**
 * Suraya Central Intelligence - هستهٔ مدیریتی (اسکلت)
 * قوانین قابل‌تغییر + هماهنگی عامل‌ها
 */
'use strict';

class PolicyEngine {
  constructor() {
    this.version = 1;
    this.rules = {
      creatorSharePercent: 4,
      transferTaxPercent: 2,
      languageDefault: 'fa',
      walletEnabled: true,
      exchangeEnabled: false,
      edgeAgentEnabled: true,
      requireUserConsentForDevice: true
    };
    this.history = [];
  }

  getRules() {
    return Object.assign({ version: this.version }, this.rules);
  }

  updateRules(patch, byAdmin) {
    if (!byAdmin) throw new Error('Only admin/site can change rules');
    var before = Object.assign({}, this.rules);
    Object.assign(this.rules, patch);
    this.version++;
    this.history.push({
      at: Date.now(),
      version: this.version,
      before: before,
      after: Object.assign({}, this.rules)
    });
    return this.getRules();
  }
}

class CentralIntelligence {
  constructor() {
    this.policy = new PolicyEngine();
    this.agents = new Map();
    this.insights = [];
    this.commands = [];
  }

  registerAgent(agentId, meta) {
    this.agents.set(agentId, {
      id: agentId,
      meta: meta || {},
      lastSync: Date.now(),
      consent: !!(meta && meta.consent)
    });
    return true;
  }

  syncFromAgent(agentId, payload) {
    var agent = this.agents.get(agentId);
    if (!agent) return { ok: false, error: 'unknown_agent' };
    if (!agent.consent && payload && payload.deviceSignals) {
      return { ok: false, error: 'consent_required' };
    }
    agent.lastSync = Date.now();
    if (payload && payload.insight) {
      this.insights.push({
        at: Date.now(),
        agentId: agentId,
        insight: payload.insight
      });
    }
    return {
      ok: true,
      policy: this.policy.getRules(),
      pendingCommands: this.commands.filter(function (c) {
        return c.agentId === agentId && !c.done;
      })
    };
  }

  enqueueCommand(agentId, action, data) {
    var cmd = {
      id: 'CMD-' + Date.now(),
      agentId: agentId,
      action: action,
      data: data || {},
      at: Date.now(),
      done: false
    };
    this.commands.push(cmd);
    return cmd;
  }

  learnDaily() {
    // اسکلت یادگیری: جمع‌بندی بینش‌ها برای بهبود قوانین پیشنهادی
    return {
      insightsCount: this.insights.length,
      agents: this.agents.size,
      policyVersion: this.policy.version,
      note: 'یادگیری تدریجی — نسخهٔ بعدی مدل را ارتقا می‌دهد'
    };
  }

  status() {
    return {
      policy: this.policy.getRules(),
      agents: this.agents.size,
      insights: this.insights.length,
      commands: this.commands.length
    };
  }
}

module.exports = {
  PolicyEngine: PolicyEngine,
  CentralIntelligence: CentralIntelligence
};
