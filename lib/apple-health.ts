// Apple Health record type identifiers
export const AH = {
  // Body
  WEIGHT:       "HKQuantityTypeIdentifierBodyMass",
  BMI:          "HKQuantityTypeIdentifierBodyMassIndex",
  BODY_FAT:     "HKQuantityTypeIdentifierBodyFatPercentage",
  WAIST:        "HKQuantityTypeIdentifierWaistCircumference",

  // Vitals
  HEART_RATE:   "HKQuantityTypeIdentifierHeartRate",
  RESTING_HR:   "HKQuantityTypeIdentifierRestingHeartRate",
  HRV:          "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
  BP_SYSTOLIC:  "HKQuantityTypeIdentifierBloodPressureSystolic",
  BP_DIASTOLIC: "HKQuantityTypeIdentifierBloodPressureDiastolic",
  SPO2:         "HKQuantityTypeIdentifierOxygenSaturation",

  // Activity
  STEPS:        "HKQuantityTypeIdentifierStepCount",
  ACTIVE_CAL:   "HKQuantityTypeIdentifierActiveEnergyBurned",
  DISTANCE:     "HKQuantityTypeIdentifierDistanceWalkingRunning",
  FLIGHTS:      "HKQuantityTypeIdentifierFlightsClimbed",

  // Sleep
  SLEEP:        "HKCategoryTypeIdentifierSleepAnalysis",

  // Nutrition
  CAL_FOOD:     "HKQuantityTypeIdentifierDietaryEnergyConsumed",
  PROTEIN:      "HKQuantityTypeIdentifierDietaryProtein",
  CARBS:        "HKQuantityTypeIdentifierDietaryCarbohydrates",
  FATS:         "HKQuantityTypeIdentifierDietaryFatTotal",
  WATER:        "HKQuantityTypeIdentifierDietaryWater",
} as const;

// All types we import from Apple Health exports
export const IMPORTED_TYPES = new Set(Object.values(AH));

// Workout activity types we recognise
export const WORKOUT_PREFIX = "HKWorkoutActivityType";

// Sleep category values Apple Health uses
export const SLEEP_ASLEEP_VALUES = new Set([
  "HKCategoryValueSleepAnalysisAsleep",
  "HKCategoryValueSleepAnalysisAsleepCore",
  "HKCategoryValueSleepAnalysisAsleepDeep",
  "HKCategoryValueSleepAnalysisAsleepREM",
  // numeric form used in older exports
  "1", "3", "4", "5",
]);

// Human-readable workout names
export const WORKOUT_NAMES: Record<string, string> = {
  HKWorkoutActivityTypeRunning: "Running",
  HKWorkoutActivityTypeCycling: "Cycling",
  HKWorkoutActivityTypeWalking: "Walking",
  HKWorkoutActivityTypeSwimming: "Swimming",
  HKWorkoutActivityTypeStrengthTraining: "Strength Training",
  HKWorkoutActivityTypeFunctionalStrengthTraining: "Functional Training",
  HKWorkoutActivityTypeYoga: "Yoga",
  HKWorkoutActivityTypeHighIntensityIntervalTraining: "HIIT",
  HKWorkoutActivityTypePilates: "Pilates",
  HKWorkoutActivityTypeElliptical: "Elliptical",
  HKWorkoutActivityTypeRowing: "Rowing",
  HKWorkoutActivityTypeStairs: "Stair Climbing",
  HKWorkoutActivityTypeBoxing: "Boxing",
  HKWorkoutActivityTypeMixedCardio: "Mixed Cardio",
  HKWorkoutActivityTypeCoreTraining: "Core Training",
  HKWorkoutActivityTypeCrossTraining: "Cross Training",
  HKWorkoutActivityTypeSoccer: "Soccer",
  HKWorkoutActivityTypeBasketball: "Basketball",
  HKWorkoutActivityTypeTennis: "Tennis",
  HKWorkoutActivityTypeOther: "Other",
};

export function workoutLabel(type: string): string {
  return WORKOUT_NAMES[type] ?? type.replace("HKWorkoutActivityType", "");
}
