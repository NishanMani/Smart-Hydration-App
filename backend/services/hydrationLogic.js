export const calculateHydrationGoal = (data = {}) => {
<<<<<<< HEAD
  const {
    weight = 0,
    height = 0,
    age = 0,
    gender = "",
    activityLevel = "",
    climate = "",
    specialCondition = "",
    lifestyle = "",
    pregnant = false,
    breastfeeding = false,
    unit = "ml"
  } = data;

  const parsedWeight = Number(weight || 0);
  const parsedHeight = Number(height || 0);
  const parsedAge = Number(age || 0);

  let baseIntake = parsedWeight > 0 ? parsedWeight * 35 : 2000;

  if (parsedAge >= 65) baseIntake *= 0.9;
  else if (parsedAge >= 55) baseIntake *= 0.95;

=======
  const weight = Number(data.weight);
  const height = Number(data.height);
  const age = Number(data.age);
  const gender = String(data.gender || "");
  const activityLevel = String(data.activityLevel || "");
  const climate = String(data.climate || "");
  const specialCondition = String(data.specialCondition || "");
  const pregnant = data.pregnant === true;
  const breastfeeding = data.breastfeeding === true;
  const lifestyle = String(data.lifestyle || "");
  const unit = String(data.unit || "");

  if (![weight, height, age].every(Number.isFinite)) {
    throw new Error("Invalid profile data for hydration goal calculation");
  }
 
  let baseIntake = weight * 35;
 
  if (age >= 65) baseIntake *= 0.9;
  else if (age >= 55) baseIntake *= 0.95;
 
>>>>>>> origin/main
  if (gender.toLowerCase() === "male") baseIntake *= 1.05;

  const heightInMeters = parsedHeight > 0 ? parsedHeight / 100 : 0;
  const bmi =
    parsedWeight > 0 && heightInMeters > 0
      ? parsedWeight / (heightInMeters * heightInMeters)
      : 0;

  if (bmi < 18.5) baseIntake *= 1.05;
  else if (bmi >= 25 && bmi < 30) baseIntake *= 1.1;
  else if (bmi >= 30) baseIntake *= 1.15;

  switch (activityLevel) {
    case "Sedentary": baseIntake += 0; break;
    case "Light": baseIntake += 300; break;
    case "Moderate": baseIntake += 600; break;
    case "Active": baseIntake += 900; break;
    case "Very Active": baseIntake += 1200; break;
  }

  switch (climate) {
    case "Moderate": baseIntake += 250; break;
    case "Hot": baseIntake += 500; break;
    case "Cold": baseIntake += 100; break;
  }

  if (specialCondition === "Pregnant" || pregnant) baseIntake += 700;
  if (specialCondition === "Breastfeeding" || breastfeeding) baseIntake += 1000;

  switch (lifestyle) {
    case "Standard": baseIntake += 0; break;
    case "Athlete": baseIntake += 800; break;
    case "Office Worker": baseIntake += 200; break;
    case "Outdoor Worker": baseIntake += 700; break;
    case "Senior citizen": baseIntake *= 0.9; break;
    case "Senior Citizen": baseIntake *= 0.9; break;
    case "Senior": baseIntake *= 0.9; break;
  }

  let result = Math.round(baseIntake);

  if (unit === "oz") result = Math.round(result / 29.5735);

  return result;
};
