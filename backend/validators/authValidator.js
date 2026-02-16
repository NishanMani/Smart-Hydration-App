import { body } from "express-validator";
 
export const registerValidator = [
 
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters"),
 
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
 
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
 
  body("weight")
    .notEmpty()
    .withMessage("Weight is required")
    .isFloat({ min: 1 })
    .withMessage("Weight must be a positive number"),
 
  body("height")
    .notEmpty()
    .withMessage("Height is required")
    .isFloat({ min: 1 })
    .withMessage("Height must be a positive number"),
 
  body("age")
    .notEmpty()
    .withMessage("Age is required")
    .isInt({ min: 1 })
    .withMessage("Age must be a valid number"),
 
  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["male", "female"])
    .withMessage("Gender must be male or female"),
 
  body("activityLevel")
    .optional()
    .isIn(["Sedentary", "Light", "Moderate", "Active", "Very Active"])
    .withMessage("Invalid activity level"),
 
  body("climate")
    .optional()
    .isIn(["Moderate", "Hot", "Cold"])
    .withMessage("Invalid climate type"),
 
  body("specialCondition")
    .optional()
    .isIn(["Pregnant", "Breastfeeding"])
    .withMessage("Invalid special condition"),
 
  body("lifestyle")
    .optional()
    .isIn(["Athlete", "Office Worker", "Outdoor Worker", "Senior"])
    .withMessage("Invalid lifestyle"),
 
  body("unit")
    .optional()
    .isIn(["ml", "oz"])
    .withMessage("Unit must be ml or oz"),
];
 
export const loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
 
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];
 
 