const PaidUser = require('../models/PaidUser');
const UserByContact = require('../models/UserByContact');

const FREE_CREDITS = 10;

// False for listings that can't be contacted, so nobody spends a credit on them: bulk imports
// store '0000000000' when a row has no number, and sold/unapproved listings keep theirs.
function hasContact(prop) {
  return prop.status === 'active' && prop.isApproved !== false && /[1-9]/.test(prop.contactPhone || '');
}

// Returns the wallet, creating it the first time a phone is seen. $setOnInsert means the free
// credits are granted once per number, however many times that user logs in.
async function ensureWallet({ userId, phone, name }) {
  const nowIso = new Date().toISOString();
  const upsert = () => PaidUser.findOneAndUpdate(
    { phone },
    { $setOnInsert: { userId, name: name || '', freeCredits: FREE_CREDITS, createdAt: nowIso, updatedAt: nowIso } },
    { new: true, upsert: true, projection: { _id: 0 } },
  ).lean();
  try {
    return await upsert();
  } catch (e) {
    if (e.code !== 11000) throw e;
    return upsert(); // lost the insert race to a parallel request, so the wallet exists now
  }
}

// Takes one credit and records the unlock in a single atomic write, so a double-click or two
// open tabs can't charge twice or overdraw. Returns null when nothing was charged.
function spendCredit(phone, propertyId) {
  const nowIso = new Date().toISOString();
  return PaidUser.findOneAndUpdate(
    { phone, freeCredits: { $gt: 0 }, 'unlockedProperties.propertyId': { $ne: propertyId } },
    {
      $inc: { freeCredits: -1 },
      $push: { unlockedProperties: { propertyId, unlockedAt: nowIso } },
      $set: { updatedAt: nowIso },
    },
    { new: true, projection: { _id: 0 } },
  ).lean();
}

// Adds properties to the user's My Contacts list. $addToSet keeps each one in the list once.
async function saveContacts(userId, propertyIds) {
  const nowIso = new Date().toISOString();
  const save = () => UserByContact.updateOne(
    { userId },
    { $addToSet: { propertyIds: { $each: propertyIds } }, $set: { updatedAt: nowIso }, $setOnInsert: { createdAt: nowIso } },
    { upsert: true },
  );
  try {
    await save();
  } catch (e) {
    if (e.code !== 11000) throw e;
    await save(); // lost the insert race to a parallel request, so the document exists now
  }
}

module.exports = { FREE_CREDITS, hasContact, ensureWallet, spendCredit, saveContacts };
