import { Axis, MeshBuilder, Scene, Vector3 } from "babylonjs";
import { wsClient } from "../../../../connection/connectionClient";
import { scene } from "../../../main";
import { isInHitzone } from "../../../others/tools";
import { StoneProjectile } from "../../weapons/projectiles/stoneProjectile";
import { ModelEnum } from "../models";
import { Player } from "./player";

export class Ranger extends Player {

    constructor(scene: Scene, avatar_username: string) {
        super(scene, avatar_username, ModelEnum.Ranger.intrinsicParameterMesh)
        this.spawn()
    }

    attack_0(onlyDisplay = false) {
        console.log("mage ", this.name, " casts normal attack");
        if (onlyDisplay) return

        setTimeout(() => {
            if (this) {
                var hitzone = MeshBuilder.CreateBox("hitzone" + this.name, { width: 2, height: 2, depth: 2 }, scene)
                hitzone.position = this.shape.position.add(this.shape.getDirection(Axis.Z).normalize().scale(2))
                hitzone.position.y += 0.8
                hitzone.setDirection(this.shape.getDirection(Axis.Z))
                hitzone.checkCollisions = false
                hitzone.isPickable = false
                hitzone.isVisible = false

                //display hitzone bounding box
                /*var bboxGizmo = new BoundingBoxGizmo()
                bboxGizmo.attachedMesh = hitzone
                bboxGizmo.setColor(new Color3(1, 0, 0))
                setTimeout(() => { bboxGizmo.dispose() }, 1000)*/

                hitzone.computeWorldMatrix(true);

                wsClient.monster_list.forEach(monster => {
                    if (isInHitzone(monster.shape, hitzone)) {
                        monster.take_damage(this.shape.position, 20);
                        //set bounding box color to green if it hits a monster
                        //bboxGizmo.setColor(new Color3(0, 1, 0))
                    }
                })

                wsClient.player_list.forEach(player => {
                    if (player !== this && isInHitzone(player.shape, hitzone)) {
                        player.send_this_take_damage(20);
                        //set bounding box color to blue if it hits a player
                        //bboxGizmo.setColor(new Color3(0, 0, 1))
                    }
                })

                hitzone.dispose()
            }
        },
            500
        )

        this.canMove = false;
        this.update_status("Punching")
        setTimeout(() => {
            this.canMove = true
            this.update_status("Idle")
        }, 1000)
    }

    attack_1(onlyDisplay = false) {
        //throw a stone
        console.log("ranger  ", this.name, " casts special attack");

        //ANIMATION
        this.canMove = false;
        this.update_status("Punching")
        setTimeout(() => {
            this.canMove = true
            this.update_status("Idle")
        }, 1000)

        //DAMAGE
        setTimeout(() => scene.projectileList.push(new StoneProjectile(this, onlyDisplay, {})), 500)

    }

    take_damage(source: Vector3, amount: number, knockback_power?: number): void {
        if (!this.takeHits) return
        this.update_status("TakingHit")
        setTimeout(() => {
            if (this && this.getStatus() === "TakingHit") this.update_status("Idle")
        }, 300)
        super.take_damage(source, amount, knockback_power)
    }
}