/**
 * Suraya Wallet-AI — سرور عملیاتی نسخه ۱
 * اجرا: npm install && npm start
 * سپس در مرورگر: http://localhost:3000
 */
'use strict';

var express = require('express');
var cors = require('cors');
var path = require('path');
var fs = require('fs');

var CentralIntelligence = require('./ai/central-core').CentralIntelligence;
var generateWallet = require('./wallet/wallet-core').generateWallet;
var SurayaWallet = require('./wallet/wallet-core').SurayaWallet;
var createExchange = require('./exchange/orderbook').createExchange;

// اگر پوشه bridge با نام عجیب است، هر دو مسیر را امتحان می‌کنیم
var applyPolicyToChainConfig;
try {
  applyPolicyToChainConfig = require('./bridge/policy-chain').applyPolicyToChainConfig;
} catch (e1) {
  try {
    applyPolicyToChainConfig = require('./A — bridge/policy-chain').applyPolicyToChainConfig;
  } catch (e2) {
    applyPolicyToChainConfig = function (policy, cfg) {
      return {
        creatorSharePercent: (policy && policy.creatorSharePercent) || 4,
        transferTaxPercent: (policy && policy.transferTaxPercent) || 2,
        exchangeEnabled: !!(policy && policy.exchangeEnabled),
        policyVersion: (policy && policy.version) || 1
      };
    };
  }
}

var app = express();
var PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

var central = new CentralIntelligence();
var wallets = new Map();

// صفحه کیف
app.get('/', function (req, res) {
  var ui = path.join(__dirname, 'wallet', 'wallet-ui.fa.html');
  if (fs.existsSync(ui)) return res.sendFile(ui);
  res.type('text').send('کیف ثریا — فایل UI پیدا نشد');
});

// وضعیت مرکز
app.get('/api/status', function (req, res) {
  var policy = central.policy.getRules();
  var chainCfg = applyPolicyToChainConfig(policy, {});
  res.json({
    ok: true,
    name: 'Suraya Wallet-AI',
    central: central.status(),
    chainConfig: chainCfg,
    exchange: createExchange(policy)
  });
});

// قوانین جاری
app.get('/api/policy', function (req, res) {
  res.json(central.policy.getRules());
});

// فقط ادمین — تغییر قوانین (بعداً با کلید امن کن)
app.post('/api/policy', function (req, res) {
  try {
    var updated = central.policy.updateRules(req.body || {}, true);
    res.json({ ok: true, policy: updated });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ساخت کیف
app.post('/api/wallet/create', function (req, res) {
  var generated = generateWallet();
  var w = new SurayaWallet({ address: generated.address });
  w.applyPolicy(central.policy.getRules());
  w.credit('ARZA', 0, 'ساخت کیف');
  wallets.set(generated.address, {
    wallet: w,
    privateKey: generated.privateKey
  });
  res.json({
    ok: true,
    address: generated.address,
    privateKey: generated.privateKey,
    warning: 'کلید خصوصی را فقط خودتان نگه دارید. در پروداکشن این پاسخ محدود می‌شود.',
    summary: w.getSummary()
  });
});

// موجودی
app.get('/api/wallet/:address', function (req, res) {
  var entry = wallets.get(req.params.address);
  if (!entry) return res.status(404).json({ ok: false, error: 'کیف پیدا نشد' });
  entry.wallet.applyPolicy(central.policy.getRules());
  res.json({ ok: true, summary: entry.wallet.getSummary() });
});

// واریز آزمایشی (فقط تست)
app.post('/api/wallet/:address/credit', function (req, res) {
  var entry = wallets.get(req.params.address);
  if (!entry) return res.status(404).json({ ok: false, error: 'کیف پیدا نشد' });
  var amount = Number(req.body && req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ ok: false, error: 'مبلغ نامعتبر' });
  entry.wallet.credit('ARZA', amount, 'واریز آزمایشی');
  res.json({ ok: true, summary: entry.wallet.getSummary() });
});

// ثبت عامل لبه
app.post('/api/agent/register', function (req, res) {
  var id = (req.body && req.body.agentId) || ('AGENT-' + Date.now());
  var consent = !!(req.body && req.body.consent);
  central.registerAgent(id, { consent: consent, platform: (req.body && req.body.platform) || 'web' });
  res.json({ ok: true, agentId: id });
});

app.post('/api/agent/sync', function (req, res) {
  var agentId = req.body && req.body.agentId;
  if (!agentId) return res.status(400).json({ ok: false, error: 'agentId لازم است' });
  var result = central.syncFromAgent(agentId, {
    insight: req.body.insight,
    deviceSignals: req.body.deviceSignals
  });
  res.json(result);
});

app.listen(PORT, function () {
  console.log('Suraya Wallet-AI running on http://localhost:' + PORT);
  console.log('Policy version', central.policy.version);
});
