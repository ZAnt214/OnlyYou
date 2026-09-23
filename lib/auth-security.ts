const COMMON_PASSWORDS = new Set([
  "123456789012",
  "password1234",
  "senha123456",
  "qwerty123456",
  "jobe12345678",
]);

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validatePassword(password: string, identityValues: string[] = []) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres na senha.`;
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`;
  }

  const normalizedPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.has(normalizedPassword)) {
    return "Escolha uma senha menos comum.";
  }

  const containsIdentity = identityValues
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length >= 3)
    .some((value) => normalizedPassword.includes(value));

  if (containsIdentity) {
    return "A senha não pode conter seu e-mail ou nome de usuário.";
  }

  const hasLetter = /[a-z\p{L}]/iu.test(password);
  const hasNumberOrSymbol = /[^a-z\p{L}\s]/iu.test(password);
  if (!hasLetter || !hasNumberOrSymbol) {
    return "Misture letras com números ou símbolos.";
  }

  return null;
}
