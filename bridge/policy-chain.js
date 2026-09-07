/**
 * اتصال قوانین مرکز به استخراج و کارمزد زنجیره
 */
'use strict';

function applyPolicyToChainConfig(policy, chainConfig) {
  policy = policy || {};
  chainConfig = chainConfig || {};
  return {
    difficulty: chainConfig.difficulty != null ? chainConfig.difficulty : 2,
    blockReward: chainConfig.blockReward != null ? chainConfig.blockReward : 50,
    maxTxPerBlock: chainConfig.maxTxPerBlock != null ? chainConfig.maxTxPerBlock : 1000,
    creatorSharePercent: policy.creatorSharePercent != null ? policy.creatorSharePercent : 4,
    transferTaxPercent: policy.transferTaxPercent != null ? policy.transferTaxPercent : 2,
    walletEnabled: policy.walletEnabled !== false,
    exchangeEnabled: !!policy.exchangeEnabled,
    languageDefault: policy.languageDefault || 'fa',
    policyVersion: policy.version || 1
  };
}

function getCreatorShare(totalReward, percent) {
  percent = percent != null ? percent : 4;
  var creatorShare = Math.floor(totalReward * percent / 100);
  return {
    totalReward: totalReward,
    creatorShare: creatorShare,
    minerShare: totalReward - creatorShare,
    percent: percent
  };
}

module.exports = {
  applyPolicyToChainConfig: applyPolicyToChainConfig,
  getCreatorShare: getCreatorShare
};
