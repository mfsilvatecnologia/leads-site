export type BuyerKind = 'PF' | 'PJ';

export function taxIdDigitsOnly(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

function isValidCpfDigits(digits: string): boolean {
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i], 10) * (10 - i);
  let mod = (sum * 10) % 11;
  if (mod === 10 || mod === 11) mod = 0;
  if (mod !== parseInt(digits[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i], 10) * (11 - i);
  mod = (sum * 10) % 11;
  if (mod === 10 || mod === 11) mod = 0;
  return mod === parseInt(digits[10], 10);
}

function isValidCnpjDigits(digits: string): boolean {
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i], 10) * w1[i];
  let mod = sum % 11;
  const d1 = mod < 2 ? 0 : 11 - mod;
  if (d1 !== parseInt(digits[12], 10)) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i], 10) * w2[i];
  mod = sum % 11;
  const d2 = mod < 2 ? 0 : 11 - mod;
  return d2 === parseInt(digits[13], 10);
}

/** Retorna mensagem de erro em português ou null se válido. */
export function validateCheckoutTaxIdClient(raw: string, buyerKind: BuyerKind): string | null {
  const digits = taxIdDigitsOnly(raw);
  if (buyerKind === 'PF') {
    if (digits.length !== 11) return 'Para pessoa física, informe um CPF com 11 dígitos.';
    if (!isValidCpfDigits(digits)) return 'CPF inválido. Verifique os dígitos.';
    return null;
  }
  if (digits.length !== 14) return 'Para pessoa jurídica, informe um CNPJ com 14 dígitos.';
  if (!isValidCnpjDigits(digits)) return 'CNPJ inválido. Verifique os dígitos.';
  return null;
}
