// Pricing constants — pinned per the capstone brief's rules:
// - cached input tokens are cheaper than fresh input
// - reasoning tokens are billed as OUTPUT tokens, never as their own category
// - categories cannot simply be summed at the same rate
// Rates are illustrative $ per 1,000 tokens (based on typical LLM provider pricing).
module.exports = {
  API_CALL_COST_CENTS: 1, // $0.01 per API call over plan (illustrative)
  AI_TOKEN_PRICING: {
    input: 0.0005,          // $ per 1k input tokens
    cached_input: 0.00025,  // cached input is half price
    output: 0.0015          // output AND reasoning tokens billed at this rate
  }
};