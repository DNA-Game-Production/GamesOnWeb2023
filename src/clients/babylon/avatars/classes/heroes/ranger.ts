import { Axis, BoundingBoxGizmo, Color3, MeshBuilder, Scene } from "babylonjs";
import { Vector3 } from "babylonjs/index";
import { wsClient } from "../../../../connection/connectionClient";
import { scene } from "../../../main";
import { isInCone, distance, isInHitzone } from "../../../others/tools";
import { ModelEnum } from "../models";
import { Player } from "./player";

export class Ranger extends Player {

    constructor(scene: Scene, avatar_username: string) {
        super(scene, avatar_username, ModelEnum.Ranger.intrinsicParameterMesh)
    }

    attack_0(onlyDisplay = false) {
        console.log("mage ", this.name, " casts normal attack");

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
                var bboxGizmo = new BoundingBoxGizmo()
                bboxGizmo.attachedMesh = hitzone
                bboxGizmo.setColor(new Color3(1, 0, 0))
                setTimeout(() => { bboxGizmo.dispose() }, 1000)

                hitzone.computeWorldMatrix(true);

                wsClient.monster_list.forEach(monster => {
                    if (isInHitzone(monster.shape, hitzone)) {
                        monster.take_damage(this.shape.position, 30);
                        //set bounding box color to green if it hits something
                        bboxGizmo.setColor(new Color3(0, 1, 0))
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
        //long cone infligeant un burst de degats et l'etat brulure, poussant les ennemis
        console.log("mage ", this.name, " casts special attack");

        //ANIMATION (TODO)

        //DAMAGE
        if (!onlyDisplay) {
            wsClient.monster_list.forEach(monster => {
                if (isInCone(monster.shape.position, this.shape.position, 10, this.shape.getDirection(Axis.Z), 1, Math.PI / 3)) {
                    console.log("distance Mage-Monstre: ", distance(this.shape.position, monster.shape.position));
                    monster.take_damage(this.shape.position, 10, (10 - distance(this.shape.position, monster.shape.position, true)) / 2);
                    monster.triggerStatus("burn");
                }
            })
        }
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