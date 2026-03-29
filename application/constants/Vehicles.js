import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Library: react-native-vector-icons (MaterialCommunityIcons)
 * Install: npm install react-native-vector-icons
 * Icon reference: https://pictogrammers.com/library/mdi/
 */

export const VEHICLE_CATEGORIES = {
  ROAD: 'Road',
  RAIL: 'Rail',
  AIR: 'Air',
  WATER: 'Water',
  SPECIAL: 'Special / Emergency',
  HEAVY: 'Heavy / Industrial',
  OTHER: 'Other',
};

export const VEHICLE_CONFIG = [
  // ── ROAD ──────────────────────────────────────────────────────────────────
  {
    id: 'Car',
    label: 'Car',
    iconName: 'car-side',
    color: '#3182CE',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Hatchback',
    label: 'Hatchback',
    iconName: 'car-hatchback',
    color: '#2B6CB0',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'SUV',
    label: 'SUV / 4x4',
    iconName: 'car-estate',
    color: '#2C5282',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Pickup',
    label: 'Pickup Truck',
    iconName: 'car-pickup',
    color: '#744210',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Taxi',
    label: 'Taxi / Cab',
    iconName: 'taxi',
    color: '#D69E2E',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Motorbike',
    label: 'Motorbike',
    iconName: 'motorbike',
    color: '#E53E3E',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Scooter',
    label: 'Scooter',
    iconName: 'scooter',
    color: '#C53030',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Moped',
    label: 'Moped',
    iconName: 'moped',
    color: '#9B2C2C',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Bicycle',
    label: 'Bicycle',
    iconName: 'bicycle',
    color: '#38A169',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'EBike',
    label: 'E-Bike',
    iconName: 'bicycle-electric',
    color: '#276749',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'KickScooter',
    label: 'Kick Scooter',
    iconName: 'kick-scooter',
    color: '#2F855A',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Auto',
    label: 'Auto Rickshaw',
    iconName: 'rickshaw',
    color: '#F6AD55',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'CycleRickshaw',
    label: 'Cycle Rickshaw',
    iconName: 'rickshaw-electric',
    color: '#ED8936',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Van',
    label: 'Van',
    iconName: 'van-utility',
    color: '#319795',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'MiniBus',
    label: 'Mini Bus',
    iconName: 'bus-side',
    color: '#2C7A7B',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Bus',
    label: 'Bus',
    iconName: 'bus',
    color: '#285E61',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'DoubleDecker',
    label: 'Double Decker Bus',
    iconName: 'bus-double-decker',
    color: '#C53030',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'SchoolBus',
    label: 'School Bus',
    iconName: 'bus-school',
    color: '#D69E2E',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Truck',
    label: 'Truck / Lorry',
    iconName: 'truck',
    color: '#805AD5',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'TruckDelivery',
    label: 'Delivery Truck',
    iconName: 'truck-delivery',
    color: '#6B46C1',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Campervan',
    label: 'Campervan / RV',
    iconName: 'caravan',
    color: '#744210',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Skateboard',
    label: 'Skateboard',
    iconName: 'skateboard',
    color: '#553C9A',
    category: VEHICLE_CATEGORIES.ROAD,
  },
  {
    id: 'Rollerblade',
    label: 'Rollerblade / Skates',
    iconName: 'roller-skate',
    color: '#44337A',
    category: VEHICLE_CATEGORIES.ROAD,
  },

  // ── RAIL ──────────────────────────────────────────────────────────────────
  {
    id: 'Train',
    label: 'Train',
    iconName: 'train',
    color: '#2B6CB0',
    category: VEHICLE_CATEGORIES.RAIL,
  },
  {
    id: 'Tram',
    label: 'Tram',
    iconName: 'tram',
    color: '#2C5282',
    category: VEHICLE_CATEGORIES.RAIL,
  },
  {
    id: 'Subway',
    label: 'Subway / Metro',
    iconName: 'subway-variant',
    color: '#1A365D',
    category: VEHICLE_CATEGORIES.RAIL,
  },
  {
    id: 'Monorail',
    label: 'Monorail',
    iconName: 'train-variant',
    color: '#2A4365',
    category: VEHICLE_CATEGORIES.RAIL,
  },
  {
    id: 'CableCar',
    label: 'Cable Car',
    iconName: 'gondola',
    color: '#744210',
    category: VEHICLE_CATEGORIES.RAIL,
  },

  // ── AIR ───────────────────────────────────────────────────────────────────
  {
    id: 'Airplane',
    label: 'Airplane',
    iconName: 'airplane',
    color: '#2B6CB0',
    category: VEHICLE_CATEGORIES.AIR,
  },
  {
    id: 'Helicopter',
    label: 'Helicopter',
    iconName: 'helicopter',
    color: '#285E61',
    category: VEHICLE_CATEGORIES.AIR,
  },
  {
    id: 'HotAirBalloon',
    label: 'Hot Air Balloon',
    iconName: 'weather-windy',
    color: '#C05621',
    category: VEHICLE_CATEGORIES.AIR,
  },
  {
    id: 'Drone',
    label: 'Drone / UAV',
    iconName: 'quadcopter',
    color: '#553C9A',
    category: VEHICLE_CATEGORIES.AIR,
  },
  {
    id: 'Rocket',
    label: 'Rocket',
    iconName: 'rocket-launch',
    color: '#C53030',
    category: VEHICLE_CATEGORIES.AIR,
  },

  // ── WATER ─────────────────────────────────────────────────────────────────
  {
    id: 'Ship',
    label: 'Ship / Ferry',
    iconName: 'ferry',
    color: '#2C5282',
    category: VEHICLE_CATEGORIES.WATER,
  },
  {
    id: 'Sailboat',
    label: 'Sailboat',
    iconName: 'sail-boat',
    color: '#2B6CB0',
    category: VEHICLE_CATEGORIES.WATER,
  },
  {
    id: 'Speedboat',
    label: 'Speedboat',
    iconName: 'speedometer',
    color: '#2C7A7B',
    category: VEHICLE_CATEGORIES.WATER,
  },
  {
    id: 'Kayak',
    label: 'Kayak / Canoe',
    iconName: 'kayaking',
    color: '#276749',
    category: VEHICLE_CATEGORIES.WATER,
  },
  {
    id: 'Submarine',
    label: 'Submarine',
    iconName: 'submarine',
    color: '#1A365D',
    category: VEHICLE_CATEGORIES.WATER,
  },

  // ── SPECIAL / EMERGENCY ───────────────────────────────────────────────────
  {
    id: 'Ambulance',
    label: 'Ambulance',
    iconName: 'ambulance',
    color: '#E53E3E',
    category: VEHICLE_CATEGORIES.SPECIAL,
  },
  {
    id: 'FireTruck',
    label: 'Fire Truck',
    iconName: 'fire-truck',
    color: '#C53030',
    category: VEHICLE_CATEGORIES.SPECIAL,
  },
  {
    id: 'PoliceCar',
    label: 'Police Car',
    iconName: 'police-badge',
    color: '#2B6CB0',
    category: VEHICLE_CATEGORIES.SPECIAL,
  },
  {
    id: 'TowTruck',
    label: 'Tow Truck',
    iconName: 'tow-truck',
    color: '#744210',
    category: VEHICLE_CATEGORIES.SPECIAL,
  },
  {
    id: 'Tank',
    label: 'Military Tank',
    iconName: 'tank',
    color: '#4A5568',
    category: VEHICLE_CATEGORIES.SPECIAL,
  },

  // ── HEAVY / INDUSTRIAL ────────────────────────────────────────────────────
  {
    id: 'Tractor',
    label: 'Tractor',
    iconName: 'tractor',
    color: '#C05621',
    category: VEHICLE_CATEGORIES.HEAVY,
  },
  {
    id: 'Forklift',
    label: 'Forklift',
    iconName: 'forklift',
    color: '#D69E2E',
    category: VEHICLE_CATEGORIES.HEAVY,
  },
  {
    id: 'Crane',
    label: 'Crane',
    iconName: 'crane',
    color: '#B7791F',
    category: VEHICLE_CATEGORIES.HEAVY,
  },
  {
    id: 'Bulldozer',
    label: 'Bulldozer',
    iconName: 'bulldozer',
    color: '#975A16',
    category: VEHICLE_CATEGORIES.HEAVY,
  },
  {
    id: 'GarbageTruck',
    label: 'Garbage Truck',
    iconName: 'delete-restore',
    color: '#718096',
    category: VEHICLE_CATEGORIES.HEAVY,
  },
  {
    id: 'ConcreteMixer',
    label: 'Concrete Mixer',
    iconName: 'mixer',
    color: '#4A5568',
    category: VEHICLE_CATEGORIES.HEAVY,
  },

  // ── OTHER ─────────────────────────────────────────────────────────────────
  {
    id: 'Wheelchair',
    label: 'Wheelchair',
    iconName: 'wheelchair-accessibility',
    color: '#4299E1',
    category: VEHICLE_CATEGORIES.OTHER,
  },
  {
    id: 'Horse',
    label: 'Horse / Carriage',
    iconName: 'horse-variant',
    color: '#744210',
    category: VEHICLE_CATEGORIES.OTHER,
  },
  {
    id: 'Snowmobile',
    label: 'Snowmobile',
    iconName: 'snowmobile',
    color: '#90CDF4',
    category: VEHICLE_CATEGORIES.OTHER,
  },
  {
    id: 'ATV',
    label: 'ATV / Quad',
    iconName: 'all-terrain-vehicle',
    color: '#C05621',
    category: VEHICLE_CATEGORIES.OTHER,
  },
  {
    id: 'Other',
    label: 'Other',
    iconName: 'dots-horizontal-circle-outline',
    color: '#718096',
    category: VEHICLE_CATEGORIES.OTHER,
  },
];

export const getVehicleById = (typeId) =>
  VEHICLE_CONFIG.find((v) => v.id === typeId) ?? null;

export const getVehicleIconName = (typeId) =>
  getVehicleById(typeId)?.iconName ?? 'dots-horizontal-circle-outline';

export const getVehicleColor = (typeId) =>
  getVehicleById(typeId)?.color ?? '#718096';

export const getVehiclesByCategory = (category) =>
  VEHICLE_CONFIG.filter((v) => v.category === category);

/**
 * Drop-in icon component
 */
export const VehicleIcon = ({ typeId, size = 24, color, style }) => (
  <MaterialCommunityIcons
    name={getVehicleIconName(typeId)}
    size={size}
    color={color ?? getVehicleColor(typeId)}
    style={style}
  />
);
