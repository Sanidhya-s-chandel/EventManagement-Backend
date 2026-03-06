function lowercaseEmailMiddleware(req, res, next) {
  const email = req?.body?.email;

  if (!email) {
    return next();
  };

  if (typeof email !== 'string') {
    console.log("Email is not a valid string:", email);
    return res.status(400).json({ error: "Email must be a string" });
  };

  const normalizedEmail = email.toLowerCase().trim();

  // Basic email format validation using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    console.log("Invalid email format. Please check the email:", normalizedEmail);
    return res.status(400).json({ error: "Invalid email format" });
  };

  req.body.email = normalizedEmail;
  next();
}

module.exports = lowercaseEmailMiddleware;