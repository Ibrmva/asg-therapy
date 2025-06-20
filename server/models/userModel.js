import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true

  },

  lastname: {
    type: String,
    required: true

  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  verifyOtp:{
    type: String,
    default: ''
  },

  verifyOtpExpireAt:{
    type: Number,
    default: 0
  },
  

  isAccountVerified: {
    type: Boolean,
    default: false
  },

  resetOtp: {
    type: String,
    default: ''
  },

  resetOtpExpireAt: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
},{ timestamps: true })

const userModel = mongoose.models['user'] || mongoose.model('user', userSchema);

export default userModel;