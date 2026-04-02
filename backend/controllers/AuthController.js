const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const UserRepository = require("../repositories/UserRepository");

/* ── Email transporter — recreated every call so .env changes take effect ── */
const getTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.SMTP_HOST || "smtp.gmail.com",
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: (process.env.SMTP_PASS || "").replace(/\s+/g, ""), // strip any spaces
    },
  });

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const userPayload = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

class AuthController {
  // POST /api/auth/register
  async register(req, res, next) {
    try {
      const { name, email, password, role, phone, address } = req.body;
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser)
        return res.status(409).json({ success: false, message: "Email already registered." });

      const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
      const user = await UserRepository.create({ name, email, password: hashedPassword, role: role || "customer", phone, address });
      return res.status(201).json({ success: true, message: "Registration successful.", data: { user: userPayload(user), token: signToken(user) } });
    } catch (error) { next(error); }
  }

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await UserRepository.findByEmail(email);
      if (!user || !user.is_active)
        return res.status(401).json({ success: false, message: "Invalid email or password." });

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid)
        return res.status(401).json({ success: false, message: "Invalid email or password." });

      return res.status(200).json({ success: true, message: "Login successful.", data: { user: userPayload(user), token: signToken(user) } });
    } catch (error) { next(error); }
  }

  // GET /api/auth/me
  async getMe(req, res, next) {
    try {
      const user = await UserRepository.findById(req.user.id);
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/auth/me
  async updateMe(req, res, next) {
    try {
      const { name, phone, address } = req.body;
      const user = await UserRepository.update(req.user.id, { name, phone, address });
      return res.status(200).json({ success: true, message: "Profile updated.", data: user });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/auth/change-password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await UserRepository.findByEmail(req.user.email);
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid)
        return res.status(401).json({ success: false, message: "Current password is incorrect." });

      const hashed = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);
      await UserRepository.update(req.user.id, { password: hashed });
      return res.status(200).json({ success: true, message: "Password changed successfully." });
    } catch (error) { next(error); }
  }

  // POST /api/auth/forgot-password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const user = await UserRepository.findByEmail(email);
      // Always 200 — don't reveal whether email is registered
      if (!user || !user.is_active) {
        return res.status(200).json({ success: true, message: "If that email is registered you will receive a reset link shortly." });
      }

      const resetToken = jwt.sign(
        { id: user.id, purpose: "password_reset" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

      await getTransporter().sendMail({
        from: process.env.EMAIL_FROM || `"HungryHub" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Reset your HungryHub password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
            <h2 style="color:#f97316;margin-bottom:8px;">Reset your password</h2>
            <p style="color:#94a3b8;">Hi ${user.name},</p>
            <p style="color:#94a3b8;">We received a request to reset your password. Click the button below — this link expires in <strong style="color:#f1f5f9;">15 minutes</strong>.</p>
            <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#f97316;color:white;border-radius:8px;text-decoration:none;font-weight:700;">Reset Password</a>
            <p style="color:#475569;font-size:0.8rem;">If you didn't request this, you can safely ignore this email.</p>
          </div>`,
      });

      return res.status(200).json({ success: true, message: "If that email is registered you will receive a reset link shortly." });
    } catch (error) { next(error); }
  }

  // POST /api/auth/reset-password
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(400).json({ success: false, message: "Reset link is invalid or has expired." });
      }
      if (payload.purpose !== "password_reset")
        return res.status(400).json({ success: false, message: "Invalid reset token." });

      const hashed = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
      await UserRepository.update(payload.id, { password: hashed });
      return res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
    } catch (error) { next(error); }
  }

  // POST /api/auth/google
  async googleAuth(req, res, next) {
    try {
      const { credential } = req.body;
      if (!credential)
        return res.status(400).json({ success: false, message: "Google credential is required." });
      if (!process.env.GOOGLE_CLIENT_ID)
        return res.status(503).json({ success: false, message: "Google OAuth is not configured on this server." });

      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      const { name, email, sub: googleId } = ticket.getPayload();

      let user = await UserRepository.findByEmail(email);
      if (!user) {
        const randomPw = await bcrypt.hash(googleId + process.env.JWT_SECRET, 12);
        user = await UserRepository.create({ name, email, password: randomPw, role: "customer" });
      }
      if (!user.is_active)
        return res.status(403).json({ success: false, message: "Your account has been deactivated." });

      return res.status(200).json({ success: true, message: "Google login successful.", data: { user: userPayload(user), token: signToken(user) } });
    } catch (error) { next(error); }
  }

  // POST /api/auth/facebook
  async facebookAuth(req, res, next) {
    try {
      const { accessToken } = req.body;
      if (!accessToken)
        return res.status(400).json({ success: false, message: "Facebook access token is required." });
      if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET)
        return res.status(503).json({ success: false, message: "Facebook OAuth is not configured on this server." });

      // Verify token validity
      const verifyRes = await axios.get(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
      );
      if (!verifyRes.data?.data?.is_valid)
        return res.status(401).json({ success: false, message: "Invalid Facebook token." });

      // Fetch profile
      const profileRes = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
      );
      const { name, email, id: fbId } = profileRes.data;
      if (!email)
        return res.status(400).json({ success: false, message: "Facebook account has no email. Please use email/password login." });

      let user = await UserRepository.findByEmail(email);
      if (!user) {
        const randomPw = await bcrypt.hash(fbId + process.env.JWT_SECRET, 12);
        user = await UserRepository.create({ name, email, password: randomPw, role: "customer" });
      }
      if (!user.is_active)
        return res.status(403).json({ success: false, message: "Your account has been deactivated." });

      return res.status(200).json({ success: true, message: "Facebook login successful.", data: { user: userPayload(user), token: signToken(user) } });
    } catch (error) { next(error); }
  }
}

module.exports = new AuthController();
