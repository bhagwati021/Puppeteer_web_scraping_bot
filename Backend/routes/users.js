import express from 'express';
import { User } from '../models/UserModel.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth.js';

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
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email,
      password:hashedPassword, // In a real app, hash this password
      createdAt: new Date().toISOString()
    });
    
    const response=await newUser.save();
    const token = generateToken(response.id)
    console.log("token is :",token)
    res.status(201).json({ message: 'User registered successfully', userId: newUser._id,resopnse:response,token:token });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    // Generate JWT
    const token = generateToken(user._id);

    // Set token in HttpOnly cookie
    /* res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      sameSite: 'strict', // Prevent CSRF
    }); */

    res.status(200).json({ message: 'Login successful',token: token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});


router.get('/profile',async(req,res)=>{
  try{
    const profile = await User.findOne({
        user:req.user.id
    })

    if(!profile){
        return res.status(400).json({
            msg:"No profile found for this user!"
        });
    }
    res.json(profile);
    }
catch(err){
    console.error(err.message);
    res.status(500).send("Internal Server Error!");
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