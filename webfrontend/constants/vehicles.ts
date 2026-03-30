import { 
  Car, Bike, Truck, Plane, Ship, Train, MoreHorizontal, Bus, 
  CarFront, Footprints, Info, Ambulance, Flame, ShieldAlert,
  HardHat, Trash2, Shovel, Cog, Wind, Rocket, Anchor,
  Milestone, LifeBuoy, MapPin, Zap
} from "lucide-react";

export const VEHICLE_CONFIG = [
  // ROAD
  { id: 'Car', label: 'Car', icon: Car, color: '#3182CE', category: 'Road' },
  { id: 'Hatchback', label: 'Hatchback', icon: CarFront, color: '#2B6CB0', category: 'Road' },
  { id: 'SUV', label: 'SUV / 4x4', icon: Car, color: '#2C5282', category: 'Road' },
  { id: 'Pickup', label: 'Pickup Truck', icon: Truck, color: '#744210', category: 'Road' },
  { id: 'Taxi', label: 'Taxi / Cab', icon: Info, color: '#D69E2E', category: 'Road' },
  { id: 'Motorbike', label: 'Motorbike', icon: Bike, color: '#E53E3E', category: 'Road' },
  { id: 'Scooter', label: 'Scooter', icon: Bike, color: '#C53030', category: 'Road' },
  { id: 'Moped', label: 'Moped', icon: Bike, color: '#9B2C2C', category: 'Road' },
  { id: 'Bicycle', label: 'Bicycle', icon: Milestone, color: '#38A169', category: 'Road' },
  { id: 'EBike', label: 'E-Bike', icon: Zap, color: '#276749', category: 'Road' },
  { id: 'KickScooter', label: 'Kick Scooter', icon: Milestone, color: '#2F855A', category: 'Road' },
  { id: 'Auto', label: 'Auto Rickshaw', icon: MapPin, color: '#F6AD55', category: 'Road' },
  { id: 'Van', label: 'Van', icon: Bus, color: '#319795', category: 'Road' },
  { id: 'Bus', label: 'Bus', icon: Bus, color: '#285E61', category: 'Road' },
  { id: 'Truck', label: 'Truck / Lorry', icon: Truck, color: '#805AD5', category: 'Road' },
  
  // SPECIAL
  { id: 'Ambulance', label: 'Ambulance', icon: Ambulance, color: '#E53E3E', category: 'Special' },
  { id: 'FireTruck', label: 'Fire Truck', icon: Flame, color: '#C53030', category: 'Special' },
  { id: 'PoliceCar', label: 'Police Car', icon: ShieldAlert, color: '#2B6CB0', category: 'Special' },
  
  // HEAVY
  { id: 'Tractor', label: 'Tractor', icon: HardHat, color: '#C05621', category: 'Heavy' },
  { id: 'Forklift', label: 'Forklift', icon: Cog, color: '#D69E2E', category: 'Heavy' },
  { id: 'Bulldozer', label: 'Bulldozer', icon: Shovel, color: '#975A16', category: 'Heavy' },
  
  // OTHER
  { id: 'Other', label: 'Other', icon: MoreHorizontal, color: '#718096', category: 'Other' },
];

export const MAIN_VEHICLES = ['Car', 'Motorbike', 'Scooter', 'Van', 'Truck'];
