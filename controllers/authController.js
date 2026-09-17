const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ValidationError } = require("sequelize");
const User = require("../models/User");
const { isValidEmail, validatePassword } = require("../utils/validation");

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const GENERIC_LOGIN_ERROR = "Неверные учетные данные";

async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Требуются email и пароль" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Некорректный формат email" });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }
    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ error: "Пользователь с таким email уже существует" });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email: normalizedEmail, passwordHash });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.errors.map((e) => e.message).join(", ") });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Требуются email и пароль" });
    }
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: "Учётная запись деактивирована" });
    }
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      return res.status(423).json({ error: "Аккаунт заблокирован после 5 неудачных попыток входа" });
    }
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      user.loginAttempts += 1;
      await user.save();
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }
    user.loginAttempts = 0;
    await user.save();
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
