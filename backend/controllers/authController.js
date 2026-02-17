import jwt from 'jsonwebtoken'
import User from '../models/userModel.js'
import bcrypt from "bcryptjs";

import { generateAccessToken ,generateRefreshToken} from '../utils/token.js'

export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token required",
    });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });

  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

export const registerUser = async (req, res) => {
  try {

    const {name,email,password,weight,height,age,gender,activityLevel,climate,lifestyle,dailyGoal,unit,pregnant,breastfeeding} = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({success:false,message:"Email already registered"});
    const hashedPassword = await bcrypt.hash(password, 10);
    // const user = await User.create({name,email,password:hashedPassword,weight,height,age,gender,activityLevel,climate,lifestyle,dailyGoal,unit,pregnant,breastfeeding});
    const user = await User.create({
      ...req.body,
      password: hashedPassword,
      dailyGoal: calculateHydrationGoal(req.body)
    });

    res.status(201).json({success:true,message:"User registered successfully",userId:user._id});

  } catch (err) {
    res.status(500).json({success:false,message:err.message});
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false,message: "Invalid email or password",});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password"});
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,   
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

