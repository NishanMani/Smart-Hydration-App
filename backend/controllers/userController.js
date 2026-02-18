import User from "../models/userModel.js";
import { calculateHydrationGoal } from "../services/hydrationLogic.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const existingUser = await User.findById(req.user.id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const payload = { ...req.body };
    const hydrationInputs = [
      "weight",
      "height",
      "age",
      "gender",
      "activityLevel",
      "climate",
      "lifestyle",
      "pregnant",
      "breastfeeding",
      "unit",
    ];
    const shouldRecalculateGoal = hydrationInputs.some(
      (key) => payload[key] !== undefined
    );

    if (shouldRecalculateGoal) {
      const mergedProfile = {
        weight: payload.weight ?? existingUser.weight,
        height: payload.height ?? existingUser.height,
        age: payload.age ?? existingUser.age,
        gender: payload.gender ?? existingUser.gender,
        activityLevel: payload.activityLevel ?? existingUser.activityLevel,
        climate: payload.climate ?? existingUser.climate,
        lifestyle: payload.lifestyle ?? existingUser.lifestyle,
        pregnant:
          payload.pregnant !== undefined
            ? payload.pregnant
            : existingUser.pregnant,
        breastfeeding:
          payload.breastfeeding !== undefined
            ? payload.breastfeeding
            : existingUser.breastfeeding,
        unit: payload.unit ?? existingUser.unit ?? "ml",
      };

      const computedGoal = calculateHydrationGoal(mergedProfile);
      payload.dailyGoal = String(computedGoal);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, payload, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(updatedUser);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUserProfile = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("settings");       
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserSettings = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { settings: req.body },
      { new: true, runValidators: true }
    ).select("settings");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(updatedUser.settings);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};    

export const deleteUserSettings = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $unset: { settings: "" } },
      { new: true }
    ).select("settings");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User settings deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserHydrationGoal = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("hydrationGoal");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ hydrationGoal: user.hydrationGoal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserHydrationGoal = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { hydrationGoal: req.body.hydrationGoal },
      { new: true, runValidators: true }
    ).select("hydrationGoal");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ hydrationGoal: updatedUser.hydrationGoal });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUserHydrationGoal = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $unset: { hydrationGoal: "" } },
      { new: true }
    ).select("hydrationGoal");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User hydration goal deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};      

