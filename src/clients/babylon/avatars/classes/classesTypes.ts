// export const PLAYER_CLASSES_LIST = ["Ranger", "Mage", "Warrior", "Archer", "Assassin", "Healer", "Rogue"] as const;
// export const PLAYER_CLASSES_LIST = ["Ranger", "Mage", "Warrior"] as const;
export const PLAYER_CLASSES_LIST = ["Ranger", "Mage", "Warrior"] as const;
export type PLAYER_CLASSES_TYPE = (typeof PLAYER_CLASSES_LIST)[number];

export const MONSTER_CLASSES_LIST = ["PumpkinMonster", "NightMonster", "Plant"] as const;
export type MONSTER_CLASSES_TYPE = (typeof MONSTER_CLASSES_LIST)[number];

export const OTHER_CLASSES_LIST = ["Campfire", "Grass", "PineTree", "Cactus", "Glider"] as const;
export type OTHER_CLASSES_TYPE = (typeof OTHER_CLASSES_LIST)[number];

export type AVATAR_CLASSES = MONSTER_CLASSES_TYPE | PLAYER_CLASSES_TYPE
export type ALL_CLASSES = AVATAR_CLASSES | OTHER_CLASSES_TYPE
