import { Axis, MeshBuilder, Scene, Vector3 } from "babylonjs";
import { wsClient } from "../../../../connection/connectionClient";
import { serverMessages } from "../../../../connection/connectionSoft";
import { scene, sphere1 } from "../../../main";
import { distance, isInHitzone } from "../../../others/tools";
import { Avatar } from "../../avatarHeavy";
import { ModelEnum } from "../models";

export class Monster extends Avatar {

    constructor(scene: Scene, avatar_username: string) {
        super(scene, avatar_username, ModelEnum.NightMonster.intrinsicParameterMesh)
        if (sphere1 && distance(this.shape.position, sphere1?.shape.position) < 40) {
            var audio = new Audio('audio/roar.mp3');
            audio.volume = 0.1;
            audio.play();
        }
    }

    take_damage(source: Vector3, amount: number, knockback_power = 1) {
        if (!this.takeHits) return
        wsClient.send(
            JSON.stringify({
                route: serverMessages.DAMAGE_MONSTER,
                content: JSON.stringify({ username: this.name, damage: amount })
            }))
        let direction = this.shape.position.subtract(source)
        if (knockback_power === 0) return;
        this.knockback(direction, knockback_power, false)
    }

    knockback(direction: Vector3, knockback_power: number, cumulate = false): void {
        let power = knockback_power / this.weightCategory
        if (this.canMove || cumulate) {
            wsClient.send(
                JSON.stringify({
                    route: serverMessages.KNOCKBACK_MONSTER,
                    content: JSON.stringify({ username: this.name, direction: direction, power: power })
                }))
        }
    }


    //The monster hit in front of him. The hit is represented by a hitbox (an invisible mesh), which damage the player if they interesect
    attack_0(onlyDisplay = false) {
        //DAMAGE (DELAYED: GIVE PLAYER TIME TO REACT + SYNC WITH AI POSITION - MUST BE >= 100)
        setTimeout(() => {
            if (this && this.status !== "Dying") {
                var hitzone = MeshBuilder.CreateBox("hitzone" + this.name, { width: 4, height: 3, depth: 4 }, scene)
                hitzone.position = this.shape.position.add(this.shape.getDirection(Axis.Z).normalize().scale(3))
                hitzone.setDirection(this.shape.getDirection(Axis.Z))
                hitzone.checkCollisions = false
                hitzone.isPickable = false
                //hitzone.isVisible = false

                //display hitzone bounding box
                // var bboxGizmo = new BoundingBoxGizmo()
                // bboxGizmo.attachedMesh = hitzone
                // bboxGizmo.setColor(new Color3(1, 0, 0))
                // setTimeout(() => { bboxGizmo.dispose() }, 1000)

                hitzone.computeWorldMatrix(true);
                if (sphere1 && isInHitzone(sphere1.shape, hitzone)) {
                    sphere1?.take_damage(this.shape.position, 10);
                    var audio = new Audio('audio/punch.wav');
                    audio.volume = 0.2;
                    audio.play();
                    //set bounding box color to green if it hits the player
                    // bboxGizmo.setColor(new Color3(0, 1, 0))
                }
                hitzone.dispose()
            }
        },
            1400
        )
    }
}