const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phone = /^\+?[0-9][0-9\s().-]{5,24}$/;
export function normalizeContact(contact) {
  if (contact.includes('@')) return contact.toLowerCase();
  const compact = contact.replace(/[\s().-]/g, '');
  if (/^0\d{9,10}$/.test(compact)) return '+84' + compact.slice(1);
  if (/^84\d{9,10}$/.test(compact)) return '+' + compact;
  return compact;
}
export function contactAliases(normalized) {
  return /^\+84\d{9,10}$/.test(normalized) ? [normalized, '0' + normalized.slice(3), normalized.slice(1)] : [normalized, normalized, normalized];
}
export function validateRegistration(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { input: null, errors: { body: 'Cần JSON object.' } };
  const fullName = typeof input.full_name === 'string' ? input.full_name.trim().replace(/\s+/g, ' ') : '';
  if (fullName.length < 2 || fullName.length > 100) errors.full_name = 'Tên cần 2–100 ký tự.';
  const contact = typeof input.phone_or_email === 'string' ? input.phone_or_email.trim() : '';
  const digits = contact.replace(/\D/g, '');
  if (contact.length < 5 || contact.length > 100 || !(email.test(contact) || (phone.test(contact) && digits.length >= 8 && digits.length <= 15))) errors.phone_or_email = 'Cần email hợp lệ hoặc số điện thoại có 8–15 chữ số.';
  const organization = input.organization_type || 'INDIVIDUAL';
  if (!['INDIVIDUAL','RESTAURANT','FOOD_BUSINESS','OTHER'].includes(organization)) errors.organization_type = 'Loại tổ chức không hợp lệ.';
  const dietary = input.dietary_preference || 'NONE';
  if (!['NONE','VEGAN','LOW_SODIUM','FAMILY','OTHER'].includes(dietary)) errors.dietary_preference = 'Nhu cầu ăn uống không hợp lệ.';
  const address = input.shipping_address === undefined ? '' : input.shipping_address;
  if (typeof address !== 'string' || address.length > 300) errors.shipping_address = 'Địa chỉ tối đa 300 ký tự.';
  if (input.consent !== true) errors.consent = 'Cần đồng ý để lưu thông tin và liên hệ về mẫu thử.';
  return { input: {
    full_name: fullName,
    contact,
    contact_normalized: normalizeContact(contact),
    organization_type: organization,
    dietary_preference: dietary,
    shipping_address: typeof address === 'string' ? address.trim() : ''
  }, errors };
}
