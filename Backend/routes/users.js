import express from 'express';
import { User } from '../models/UserModel.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password, // In a real app, hash this password
      createdAt: new Date().toISOString()
    });
    
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* 
//login users that already have the account ready
app.post("/login", async (req, res) => {
    const { site, email, Password } = req.body;
  
    try {
        let session;

        if (site === "https://www.quora.com/") {
            session = await loginToSiteQuora(site, email, Password);
        } else if (site === "https://stackoverflow.com/") {
            session = await loginToSiteStack(site,email, Password);
        } else {
            return res.status(400).json({ error: "Unsupported site. Use 'quora' or 'stackoverflow'." });
        }

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: "Login failed", details: error.message });
    }
});
  

 */
export default router;