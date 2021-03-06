import { Axis, Mesh, MeshBuilder, Vector3 } from "babylonjs";
import { meshes, wsClient } from "../../../connection/connectionClient";
import { serverMessages } from "../../../connection/connectionSoft";
import { scene, sphere1 } from "../../main";
import { distance, removeFromList } from "../../others/tools";
import { Player } from "../heroes/player";
import { Monster } from "../monsters/monster";

export class Bullet extends Mesh {
  myShooter: Player;
  name: string;
  static id = 0;
  angle: Vector3;
  speedCoeff: number;
  displayOnly: Boolean;
  originalPositionBullet: Vector3;
  damage: number;

  constructor(myShooter: Player, displayOnly: Boolean, p?: { damage?: number }) {
    super("Bullet" + Bullet.id + myShooter.name);
    this.name = "Bullet" + Bullet.id + myShooter.name;
    this.displayOnly = displayOnly;
    this.myShooter = myShooter;
    this.addChild(this.createSphere())
    this.angle = myShooter.shape.getDirection(Axis.Z)
    this.position = this.myShooter.shape.position.clone();
    this.originalPositionBullet = this.position.clone()
    this.speedCoeff = 0.05;
    this.rotation = this.angle
    meshes.push(this)
    this.position.x = this.position.x + this.angle.x * 3;
    this.position.z = this.position.z + this.angle.z * 3;
    this.checkCollisions = true;
    this.damage = p?.damage || 10;
    Bullet.id++;

    this.onCollide = e => {
      if (e?.parent instanceof Monster) {
        let monster = e.parent as Monster;
        if (this.myShooter.name === sphere1!.name) {
          console.log(wsClient.night_monster_list);

          wsClient.send(
            JSON.stringify({
              route: serverMessages.DAMAGE_MONSTER,
              content: JSON.stringify({ username: monster.name, damage: this.damage })
            }))
        }
      }
      this.dispose()
    }
  }

  createSphere(): Mesh {
    let sphere = MeshBuilder.CreateSphere(this.name + "model", {
      diameter: 0.5,
      segments: 16
    }, scene);
    return sphere
  }

  update() {
    if (this.speedCoeff <= 0.02) this.dispose();
    this.moveWithCollisions(this.angle.scale(this.speedCoeff))
    // this.position.x = this.position.x + this.angle.x * this.speedCoeff;
    // this.position.z = this.position.z + this.angle.z * this.speedCoeff;
    if (distance(this.position, this.originalPositionBullet) > 15) {
      this.dispose()
    }
  }

  dispose(): void {
    super.dispose()
    removeFromList(this, this.myShooter.bulletList)
    removeFromList(this, meshes)
  }
}