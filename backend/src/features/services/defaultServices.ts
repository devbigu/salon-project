export const defaultSalonServices = [
  {
    mainService: "Hair",
    services: [
      { name: "Hair Cut", price: 299, durationValue: 30, durationUnit: "MINUTES" },
      { name: "Hair Wash", price: 199, durationValue: 20, durationUnit: "MINUTES" },
      { name: "Hair Spa", price: 999, durationValue: 60, durationUnit: "MINUTES" },
      { name: "Hair Color", price: 1499, durationValue: 90, durationUnit: "MINUTES" },
      { name: "Root Touch-up", price: 799, durationValue: 45, durationUnit: "MINUTES" },
      { name: "Keratin Treatment", price: 3499, durationValue: 180, durationUnit: "MINUTES" },
    ],
  },
  {
    mainService: "Skin",
    services: [
      { name: "Cleanup", price: 499, durationValue: 30, durationUnit: "MINUTES" },
      { name: "Basic Facial", price: 799, durationValue: 45, durationUnit: "MINUTES" },
      { name: "Gold Facial", price: 1499, durationValue: 60, durationUnit: "MINUTES" },
      { name: "Detan", price: 599, durationValue: 30, durationUnit: "MINUTES" },
    ],
  },
  {
    mainService: "Waxing",
    services: [
      { name: "Full Arms Waxing", price: 499, durationValue: 30, durationUnit: "MINUTES" },
      { name: "Half Arms Waxing", price: 299, durationValue: 20, durationUnit: "MINUTES" },
      { name: "Full Legs Waxing", price: 699, durationValue: 45, durationUnit: "MINUTES" },
      { name: "Underarms Waxing", price: 199, durationValue: 15, durationUnit: "MINUTES" },
      { name: "Full Body Waxing", price: 1999, durationValue: 120, durationUnit: "MINUTES" },
    ],
  },
  {
    mainService: "Threading",
    services: [
      { name: "Eyebrows Threading", price: 99, durationValue: 10, durationUnit: "MINUTES" },
      { name: "Upper Lip Threading", price: 79, durationValue: 10, durationUnit: "MINUTES" },
      { name: "Full Face Threading", price: 299, durationValue: 25, durationUnit: "MINUTES" },
    ],
  },
  {
    mainService: "Makeup",
    services: [
      { name: "Party Makeup", price: 1999, durationValue: 90, durationUnit: "MINUTES" },
      { name: "HD Makeup", price: 3999, durationValue: 120, durationUnit: "MINUTES" },
      { name: "Bridal Makeup", price: 9999, durationValue: 240, durationUnit: "MINUTES" },
      { name: "Saree Draping", price: 499, durationValue: 30, durationUnit: "MINUTES" },
    ],
  },
  {
    mainService: "Nails",
    services: [
      { name: "Manicure", price: 599, durationValue: 45, durationUnit: "MINUTES" },
      { name: "Pedicure", price: 699, durationValue: 45, durationUnit: "MINUTES" },
      { name: "Nail Art", price: 999, durationValue: 60, durationUnit: "MINUTES" },
      { name: "Gel Polish", price: 799, durationValue: 45, durationUnit: "MINUTES" },
    ],
  },
  {
    mainService: "Massage",
    services: [
      { name: "Head Massage", price: 299, durationValue: 20, durationUnit: "MINUTES" },
      { name: "Foot Massage", price: 499, durationValue: 30, durationUnit: "MINUTES" },
      { name: "Body Massage", price: 1499, durationValue: 60, durationUnit: "MINUTES" },
    ],
  },
  {
    mainService: "Packages",
    services: [
      { name: "Hair Cut + Beard", price: 499, durationValue: 45, durationUnit: "MINUTES" },
      { name: "Facial + Cleanup", price: 1199, durationValue: 75, durationUnit: "MINUTES" },
      { name: "Pre-Bridal Package", price: 6999, durationValue: 240, durationUnit: "MINUTES" },
    ],
  },
] as const;
