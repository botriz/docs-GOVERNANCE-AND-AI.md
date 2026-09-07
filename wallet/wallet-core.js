/**
 * Suraya Wallet Core - اسکلت کیف پول فارسی‌محور
 */
'use strict';
var crypto = require('crypto');

function generateWallet() {
  var privateKey = crypto.randomBytes(32).toString('hex');
  var address = 'SRY' + crypto.createHash('sha256').update(privateKey).digest('hex').slice(0, 40);
  return {
    address: address,
    privateKey: privateKey,
    createdAt: Date.now(),
    networks: ['suraya']
  };
}

class SurayaWallet {
  constructor(opts) {
    opts = opts || {};
    this.address = opts.address || null;
    this.balances = { ARZA: 0 };
    this.history = [];
    this.policyVersion = 0;
    this.locale = 'fa';
  }

  import(address) {
    this.address = address;
    return this;
  }

  applyPolicy(policy) {
    if (!policy) return;
    this.policyVersion = policy.version || this.policyVersion;
    this.transferTaxPercent = policy.transferTaxPercent != null ? policy.transferTaxPercent : 2;
  }

  credit(symbol, amount, note) {
    if (!this.balances[symbol]) this.balances[symbol] = 0;
    this.balances[symbol] += amount;
    this.history.push({ type: 'in', symbol: symbol, amount: amount, note: note || '', at: Date.now() });
  }

  debit(symbol, amount, note) {
    if ((this.balances[symbol] || 0) < amount) throw new Error('موجودی کافی نیست');
    this.balances[symbol] -= amount;
    this.history.push({ type: 'out', symbol: symbol, amount: amount, note: note || '', at: Date.now() });
  }

  getSummary() {
    return {
      address: this.address,
      balances: Object.assign({}, this.balances),
      historyCount: this.history.length,
      policyVersion: this.policyVersion,
      locale: this.locale
    };
  }
}

module.exports = {
  generateWallet: generateWallet,
  SurayaWallet: SurayaWallet
};
