import { ALL_CLASSES } from "./classesTypes";

let buildStatusDict = (p: { [x in CharacterStatus]?: number }) => {
  let statusDict: Record<CharacterStatus, number> = {
    Idle: -1, Dying: -1, Falling: -1, Jumping: -1, Punching: -1, Running: -1,
    Walking_bw: -1, Walking_fw: -1, Swimming: -1, TakingHit: -1, Gliding: -1,
    Spawn: -1, Throw: -1
  }
  Object.keys(p).forEach(x => { statusDict[x as CharacterStatus] = p[x as CharacterStatus]! })
  return statusDict
}

let buildAttackSpeed = (p: { [x in ATTACK_TYPE]?: number }) => {
  let statusDict: Record<ATTACK_TYPE, number> = { ATTACK_0: 1000, ATTACK_1: 1000, ATTACK_2: 1000, ATTACK_3: 1000 }
  Object.keys(p).forEach((x) => { statusDict[x as ATTACK_TYPE] = p[x as ATTACK_TYPE]! })
  return statusDict
}

export type ATTACK_TYPE = "ATTACK_0" | "ATTACK_1" | "ATTACK_2" | "ATTACK_3"
export type CharacterStatus = "Idle" | "Walking_fw" | "Walking_bw" | "Running" | "Punching" | "Swimming" | "Jumping" | "Falling" | "Dying" | "TakingHit" | "Gliding" | "Spawn" | "Throw"

interface intrinsicModelPropertiesOptional1 {
  height?: number;
  width?: number;
  healthYAbove?: number;
  textYAbove?: number;
  health: number;
  walkSpeed?: number;
  runningSpeed?: number;
  weight?: number;
  attackSpeed?: { [x in ATTACK_TYPE]?: number }
  animations?: { [x in CharacterStatus]?: number },
  fileExtension: string,
  className?: ALL_CLASSES,
  scaling: number
}

interface recordAttackAnimation {
  attackSpeed?: Record<ATTACK_TYPE, number>
  animations?: Record<CharacterStatus, number>,
}

export type intrinsicModelPropertiesOptional = Readonly<Required<intrinsicModelPropertiesOptional1> & Required<recordAttackAnimation>>

export interface intrinsicModelProperties extends intrinsicModelPropertiesOptional { }

export const intrinsicProperties1: Record<ALL_CLASSES, intrinsicModelPropertiesOptional1> = {
  Mage: {
    fileExtension: "gltf",
    className: "Mage",
    health: 90,
    walkSpeed: 0.15,
    attackSpeed: { ATTACK_0: 1500, ATTACK_1: 1000 },
    scaling: 1.2
  },

  Warrior: {
    fileExtension: "gltf",
    health: 120,
    walkSpeed: 0.15,
    attackSpeed: { ATTACK_0: 1500, ATTACK_1: 12000 },
    scaling: 1
  },

  // Assassin: {
  //   fileExtension: "gltf",
  //   health: 90,
  //   walkSpeed: 0.15,
  //   attackSpeed: { ATTACK_0: 1200, ATTACK_1: 10000 },
  //   scaling: 1
  // },

  // Archer: {
  //   fileExtension: "gltf",
  //   health: 80,
  //   walkSpeed: 0.15,
  //   attackSpeed: { ATTACK_0: 800, ATTACK_1: 9000 },
  //   scaling: 1
  // },

  // Healer: {
  //   fileExtension: "gltf",
  //   health: 100,
  //   walkSpeed: 0.15,
  //   attackSpeed: { ATTACK_0: 1200, ATTACK_1: 6000 },
  //   scaling: 1
  // },

  PumpkinMonster: {
    fileExtension: "gltf",
    healthYAbove: 1.4,
    textYAbove: 1.7,
    health: 100,
    walkSpeed: 0.2,
    scaling: 2
  },

  Campfire: {
    fileExtension: "gltf",
    health: 50,
    walkSpeed: 2,
    scaling: 0.25
  },

  Grass: {
    fileExtension: "gltf",
    health: 50,
    walkSpeed: 2,
    scaling: 0.02
  },

  PineTree: {
    fileExtension: "gltf",
    health: 50,
    walkSpeed: 2,
    scaling: 1
  },

  Cactus: {
    fileExtension: "glb",
    health: 50,
    walkSpeed: 2,
    scaling: 0.4
  },

  Glider: {
    fileExtension: "glb",
    health: 50,
    walkSpeed: 2,
    scaling: 1
  },

  Ranger: {
    fileExtension: "glb",
    healthYAbove: 2,
    textYAbove: 2.3,
    health: 60,
    walkSpeed: 0.15,
    animations: {
      Walking_bw: 11, Walking_fw: 10, Throw: 9, Running: 7,
      Falling: 1, Idle: 4, Jumping: 1, Punching: 6,
      Swimming: 8, Dying: 0, TakingHit: 2,
      Gliding: 3,
    },
    scaling: 1
  },

  NightMonster: {
    fileExtension: "glb",
    height: 2,
    width: 2,
    healthYAbove: 2.8,
    textYAbove: 3.1,
    health: 30,
    walkSpeed: 0.2,
    animations: {
      Running: 3, Falling: 1, Punching: 2, Dying: 0,
    },
    scaling: 1
  },

  Plant: {
    fileExtension: "glb",
    height: 2,
    width: 1,
    healthYAbove: 2.8,
    textYAbove: 3.1,
    health: 1,
    walkSpeed: 0,
    scaling: 3
  },

  // Rogue: {
  //   fileExtension: "gltf",
  //   health: 90,
  //   walkSpeed: 0.15,
  //   attackSpeed: { "ATTACK_0": 1200, "ATTACK_1": 10000 },
  //   scaling: 1
  // }
}

let defaultValues: intrinsicModelProperties = {
  scaling: 1, attackSpeed: buildAttackSpeed({}),
  runningSpeed: 0.25, animations: buildStatusDict({}),
  weight: 1, height: 2, width: 1, healthYAbove: 1, textYAbove: 1.3,
  walkSpeed: 3, health: 2000, fileExtension: "glb", className: "Mage"
}

Object.keys(intrinsicProperties1).forEach(element => {
  let elt: ALL_CLASSES = element as ALL_CLASSES
  let p = intrinsicProperties1[elt]
  intrinsicProperties1[elt] = {
    ...defaultValues,
    ...p,
    className: elt,
    attackSpeed: buildAttackSpeed(p.attackSpeed || {}),
    animations: buildStatusDict(p.animations || {}),
  }
})

export const intrinsicProperties = intrinsicProperties1 as Readonly<Record<ALL_CLASSES, intrinsicModelPropertiesOptional>>