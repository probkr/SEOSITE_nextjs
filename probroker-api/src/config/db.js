const mongoose = require('mongoose');

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
