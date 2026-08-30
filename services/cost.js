const { API_CALL_COST_CENTS, AI_TOKEN_PRICING } = require('../config/pricing');

function calculateAiTokenCost(metadata = {}) {
  const input = metadata.input || 0;
  const cachedInput = metadata.cached_input || 0;
  const output = metadata.output || 0;
  const reasoning = metadata.reasoning || 0;

  const totalOutput = output + reasoning;

  const cost =
    (input / 1000) * AI_TOKEN_PRICING.input +
    (cachedInput / 1000) * AI_TOKEN_PRICING.cached_input +
    (totalOutput / 1000) * AI_TOKEN_PRICING.output;

  return Math.round(cost * 100);
}

function calculateEventCost(event) {
  if (event.type === 'api_call') {
    return event.quantity * API_CALL_COST_CENTS;
  }
  if (event.type === 'ai_tokens') {
    return calculateAiTokenCost(event.metadata);
  }
  return 0;
}

module.exports = { calculateAiTokenCost, calculateEventCost };