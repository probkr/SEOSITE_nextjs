const Property = require('../models/Property');
const UserByContact = require('../models/UserByContact');
const { normalizePhone } = require('../services/otpService');
const { hasContact, ensureWallet, spendCredit, saveContacts } = require('../services/creditService');

// POST /api/v1/properties/contact { propertyId } -- the only public route that returns a listing's
// phone number. Costs one credit the first time a user opens a property, and nothing after that.
exports.getContact = async (req, res) => {
  const { propertyId } = req.body || {};
  // Must be a string: a JSON object here would reach the query below as a Mongo operator.
  if (typeof propertyId !== 'string' || !propertyId) {
    return res.status(400).json({ success: false, error: 'propertyId is required', code: 'INVALID_PROPERTY' });
  }

  const prop = await Property.findOne(
    { propertyId },
    { contactName: 1, contactPhone: 1, status: 1, isApproved: 1 },
  ).lean();
  if (!prop || !hasContact(prop)) {
    return res.status(404).json({ success: false, error: 'Contact number not available for this property.', code: 'CONTACT_UNAVAILABLE' });
  }

  const send = async (wallet, charged) => {
    // The credit is already spent, so a failed save must not cost them the number. myContacts
    // picks the property up from the wallet instead.
    await saveContacts(wallet.userId, [prop._id]).catch((err) => console.error('[contacts] save failed:', err.message));
    res.json({
      success: true,
      propertyId,
      contactName: prop.contactName,
      contactPhone: prop.contactPhone,
      charged,
      freeCredits: wallet.freeCredits,
    });
  };

  const { phone } = req.user;
  const wallet = await ensureWallet(req.user);
  if (normalizePhone(prop.contactPhone) === phone) return send(wallet, false); // their own listing

  const spent = await spendCredit(phone, propertyId);
  if (spent) return send(spent, true);

  // Nothing charged: re-read, because a parallel click may have unlocked it since `wallet` was read.
  const latest = await ensureWallet(req.user);
  if (latest.unlockedProperties.some((u) => u.propertyId === propertyId)) return send(latest, false);

  res.status(402).json({ success: false, error: "You've used all your free credits.", code: 'NO_CREDITS', freeCredits: latest.freeCredits });
};

// GET /api/v1/my-contacts -- the listings this user has taken the contact of, newest first, with
// their numbers. Sold or rented listings stay in the list: the user already paid for that number.
exports.myContacts = async (req, res) => {
  const wallet = await ensureWallet(req.user);
  const saved = await UserByContact.findOne({ userId: wallet.userId }, { _id: 0, propertyIds: 1 }).lean();
  const ids = saved ? saved.propertyIds : [];

  // Unlocks from before this list existed, or whose save failed, are only in the wallet.
  const missing = await Property.find(
    { propertyId: { $in: wallet.unlockedProperties.map((u) => u.propertyId) }, _id: { $nin: ids } },
    { _id: 1 },
  ).lean();
  if (missing.length) {
    const missingIds = missing.map((p) => p._id);
    await saveContacts(wallet.userId, missingIds);
    ids.push(...missingIds);
  }

  const props = await Property.find({ _id: { $in: ids } }).lean();
  const byId = new Map(props.map(({ _id, ...prop }) => [String(_id), prop]));
  res.json({ properties: ids.map((id) => byId.get(String(id))).filter(Boolean).reverse() });
};
