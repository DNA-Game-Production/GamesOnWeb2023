import { Vector3 } from "babylonjs";
import { Scene } from "babylonjs/scene";
import { renderTimeRatio } from "../main";
import { createBasicShape } from "../others/tools";
import { AvatarSoft } from "./avatarSoft";
import { intrinsicModelPropertiesD } from "./classes/models";

export class AvatarFictive extends AvatarSoft {

    constructor(scene: Scene, avatar_username: string, p: intrinsicModelPropertiesD) {
        super(scene, avatar_username, createBasicShape(avatar_username, scene, p), p)
    }

    dispose(): void {
        super.dispose()
    }

    knockback(direction: Vector3, power: number, cumulate = false) {
        if (this.canMove || cumulate) {
            //console.log("call to knockback on ", this.name);
            direction.normalize()
            direction.y += 0.2
            direction.normalize()
            let scaledDirection = direction.scale(power / 2)
            // console.log("knockback direction: ", scaledDirection);
            this.canMove = false;
            this.canHit = false

            let intervalKnockBack = setInterval(() => {
                if (this && this.shape) this.shape.moveWithCollisions(scaledDirection.scale(renderTimeRatio))
            }, 100 / 6)
            setTimeout(() => { clearInterval(intervalKnockBack) }, 150 * power)
            setTimeout(() => { if (this) { this.canMove = true; this.canHit = true } }, 150 * power + 100)
        }
    }
}