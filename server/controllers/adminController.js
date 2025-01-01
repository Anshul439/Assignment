import jwt from "jsonwebtoken";

const admin_email = process.env.ADMIN_EMAIL
const admin_password = process.env.ADMIN_PASSWORD

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (email !== admin_email || password !== admin_password) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ email: admin_email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, message: "Login successful." });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};
