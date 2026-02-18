import jwt from "jsonwebtoken";

export const generateAccessToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_ACCESS_TOKEN_SECRET,    
    { expiresIn: "65m" }
  );
};

export const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};










  













  


