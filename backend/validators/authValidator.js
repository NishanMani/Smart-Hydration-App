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
    .exists({ checkFalsy: true })
    .withMessage("Weight is required")
    .isFloat({ min: 1 })
    .withMessage("Weight must be a positive number"),
 
  body("height")
    .exists({ checkFalsy: true })
    .withMessage("Height is required")
    .isFloat({ min: 1 })
    .withMessage("Height must be a positive number"),
 
  body("age")
    .exists({ checkFalsy: true })
    .withMessage("Age is required")
    .isInt({ min: 1 })
    .withMessage("Age must be a valid number"),
 
  body("gender")
    .exists({ checkFalsy: true })
    .withMessage("Gender is required")
    .isIn(["male", "female", "other", "Male", "Female", "Other"])
    .withMessage("Gender must be male, female or other"),
 
  body("activityLevel")
    .exists({ checkFalsy: true })
    .withMessage("Activity level is required")
    .isIn(["Sedentary", "Light", "Moderate", "Active", "Very Active"])
    .withMessage("Invalid activity level"),
 
  body("climate")
    .exists({ checkFalsy: true })
    .withMessage("Climate is required")
    .isIn(["Moderate", "Hot", "Cold"])
    .withMessage("Invalid climate type"),
 
  body("specialCondition")
    .optional()
    .isIn(["Pregnant", "Breastfeeding"])
    .withMessage("Invalid special condition"),
 
  body("lifestyle")
    .exists({ checkFalsy: true })
    .withMessage("Lifestyle is required")
    .isIn([
      "Standard",
      "Athlete",
      "Office Worker",
      "Outdoor Worker",
      "Senior",
      "Senior citizen",
      "Senior Citizen",
    ])
    .withMessage("Invalid lifestyle"),
 
  body("unit")
    .exists({ checkFalsy: true })
    .withMessage("Unit is required")
    .isIn(["ml", "oz"])
    .withMessage("Unit must be ml or oz"),

  body("pregnant")
    .exists()
    .withMessage("Pregnant field is required")
    .isBoolean()
    .withMessage("Pregnant must be true or false"),

  body("breastfeeding")
    .exists()
    .withMessage("Breastfeeding field is required")
    .isBoolean()
    .withMessage("Breastfeeding must be true or false"),
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
 
 
