const dns = require('dns');
const mongoose = require('mongoose');

// Optional: override the DNS servers Node uses. Needed on some Windows machines where Node
// picks up 127.0.0.1 as its resolver and mongodb+srv:// lookups fail with querySrv ECONNREFUSED.
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
}

async function connectDB() {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;
  if (!mongoUrl || !dbName) {
    throw new Error('MONGO_URL and DB_NAME must be set in the environment');
  }
  mongoose.set('strictQuery', false);
  // TLS defaults to on (matches the old Python app's tls=True, tlsAllowInvalidCertificates=True
  // for managed MongoDB Atlas). Set MONGO_TLS=false in .env for local/self-hosted MongoDB without TLS.
  const useTls = process.env.MONGO_TLS !== 'false';
  await mongoose.connect(mongoUrl, {
    dbName,
    ...(useTls ? { tls: true, tlsAllowInvalidCertificates: true } : {}),
  });
  console.log(`[db] connected to MongoDB database "${dbName}"`);
  return mongoose.connection;
}

module.exports = { connectDB };
