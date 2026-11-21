// Consistent JSON response shape: { success, data, message }
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, status, message, details) =>
  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });

module.exports = { ok, fail };
