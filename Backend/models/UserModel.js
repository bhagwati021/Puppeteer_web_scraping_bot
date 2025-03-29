import mongoose from "mongoose";
import bcrypt from "bcrypt";

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true }
},
{ timestamps: true });

userSchema.pre('save',async function (next){
  const user = this;

  //hash the password only if the user is new or only if the password is modified
  if (!user.isModified('password')) return next();
  try{
    //hash the password before saving it in db
    const salt=await bcrypt.genSalt(10);

    // Hash the password
    const hashedPassword = await bcrypt.hash(user.password,salt);

    //overwrite the plain password with hased ones
    user.password=hashedPassword;
    next();
  }catch(err){
    return next(err)
  }
});

userSchema.methods.comparePassword=async function(candidatePassword){
  try{
    //use bcrypt to compare the provided password with the hashed passwoord
    const isMatch=await bcrypt.compare(candidatePassword,this.password)
    return isMatch;

  }catch(err){
    throw err;
  }
}


export const User = mongoose.model('User', userSchema);