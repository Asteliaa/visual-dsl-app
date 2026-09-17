const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMMON_PASSWORDS = ["password1!", "qwerty123!", "admin123!", "welcome1!"];

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

function validatePassword(password) {
  if (password.length < 8) {
    return "Пароль должен содержать не менее 8 символов";
  }
  if (!/[a-z]/.test(password)) {
    return "Пароль должен содержать хотя бы одну строчную букву";
  }
  if (!/[A-Z]/.test(password)) {
    return "Пароль должен содержать хотя бы одну заглавную букву";
  }
  if (!/\d/.test(password)) {
    return "Пароль должен содержать хотя бы одну цифру";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Пароль должен содержать хотя бы один специальный символ";
  }
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return "Этот пароль слишком распространён, выберите другой";
  }
  return null;
}

module.exports = { isValidEmail, validatePassword };
