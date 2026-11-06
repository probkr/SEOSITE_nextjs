/**
 * Stops the API from starting with a missing, short or publicly known secret. SECRET_KEY signs
 * every login token, so a guessable value lets anyone forge one. This runs in every environment
 * because a server .env copied from .env.example may still say NODE_ENV=development.
 */
const MIN_LENGTH = 32;

// Values that have shipped in .env.example. They are public, so they protect nothing.
const KNOWN_DEFAULTS = new Set([
  'change-this-to-a-long-random-string',
  'qwertyuioplkjhgfdsazxcvbnm',
  'same-value-as-the-web-app-REVALIDATE_SECRET',
]);

function secretProblems() {
  const problems = [];
  // WEBHOOK_AUTH_KEY and REVALIDATE_SECRET may stay empty: those features are then simply off.
  for (const [name, required] of [['SECRET_KEY', true], ['WEBHOOK_AUTH_KEY', false], ['REVALIDATE_SECRET', false]]) {
    const value = (process.env[name] || '').trim();
    if (!value) {
      if (required) problems.push(`${name} is not set`);
    } else if (KNOWN_DEFAULTS.has(value)) {
      problems.push(`${name} still has the example value`);
    } else if (value.length < MIN_LENGTH) {
      problems.push(`${name} is shorter than ${MIN_LENGTH} characters`);
    }
  }
  return problems;
}

function assertSecrets() {
  const problems = secretProblems();
  if (problems.length) {
    throw new Error(`Refusing to start: ${problems.join('; ')}. Generate a value with: openssl rand -hex 32`);
  }
}

module.exports = { assertSecrets, secretProblems };
