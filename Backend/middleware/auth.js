import jwt from 'jsonwebtoken';

// Middleware to authenticate tokens
export const authenticateToken = (req, res, next) => {
    const authorization=req.cookies.token;
    if(!authorization) return res.status(401).json({error: 'token not found'});

   const token = req.cookies.token; // Extract token from cookie
    //const token=req.headers.authorization.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied/Unauthorized' });
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid Token' });
      req.user = user;
      next();
    });
  };


// Utility function to generate a JWT (optional, but useful to centralize token creation)
export const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  };