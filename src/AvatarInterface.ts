import { Mesh, Ray } from "babylonjs";

export interface AvaterInterface extends Mesh {
  ray: Ray;
  shape: undefined | Mesh;
  canJump: boolean;
  speed_coeff: number;
  currentHealth: number;
  maxHealth: number;
  gravity_acceleration: number;

  setRayPosition(): void;
}