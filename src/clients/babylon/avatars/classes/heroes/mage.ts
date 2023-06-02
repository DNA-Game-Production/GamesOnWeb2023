import { Axis, Scene, Vector3 } from "babylonjs";
import { wsClient } from "../../../../connection/connectionClient";
import { scene } from "../../../main";
import { distance } from "../../../others/tools";
import { Arrow } from "../../weapons/projectiles/arrow";
import { ModelEnum } from "../models";
import { Player } from "./player";

export class Mage extends Player {
  constructor(scene: Scene, avatar_username: string) {
    super(scene, avatar_username, ModelEnum.Mage.intrinsicParameterMesh)
  }

  attack_0(onlyDisplay = false) {
    //tire une fleche monocible avec une proba d'empoisoner l'ennemi
    //console.log("archer ", this.name, " casts normal attack");
    scene.projectileList.push(new Arrow(this, onlyDisplay, {}))
  }

  attack_1(onlyDisplay = false) {

    //ANIMATION

    if (onlyDisplay) return
    //fait un bond arrière puis tire une volée de flèche en l'air sur son ancienne position, tombant en cercle à son ancienne position et infligeant des dégats
    //console.log("archer ", this.name, " casts special attack");
    var directionArcher = this.shape.getDirection(Axis.Z)
    var positionCast = this.shape.position.clone()
    this.knockback(new Vector3(-directionArcher.x, 0, -directionArcher.z), 2, true)
    setTimeout(() => {
      wsClient.monster_list.forEach(monster => {
        if (distance(monster.shape.position, positionCast, true) < 10) {
          monster.take_damage(positionCast, 40, 0.5)
          monster.triggerStatus("poisoned")
        }
      })
    }, 500)
  }
}