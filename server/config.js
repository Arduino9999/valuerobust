function buildConfig() {
return {
PORT: parseInt(process.env.PORT || '4000', 10),
ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || '*',
RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || '',
RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || 'ebay-average-selling-price.p.rapidapi.com',
OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini'
}
}
module.exports = { buildConfig }