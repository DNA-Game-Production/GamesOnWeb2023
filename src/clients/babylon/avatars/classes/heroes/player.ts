import { Ray, Vector3 } from "babylonjs";
import { wsClient } from "../../../../connection/connectionClient";
import { serverMessages } from "../../../../connection/connectionSoft";
import { scene, sphere1 } from "../../../main";
import { Avatar } from "../../avatarHeavy";
import { Glider } from "../../tools/glider";
import { CharacterStatus } from "../intrinsicProp";

export abstract class Player extends Avatar {
    oxygen = 1000;
    glider: Glider | undefined = new Glider(this)

    take_damage(source: Vector3, amount: number, knockback_power = 1) {
        if (!this.takeHits) return
        this.healthMinus(amount);
        if (knockback_power) {
            let direction = this.shape.position.subtract(source)
            this.knockback(direction.normalize(), knockback_power / this.weightCategory)
        }
        scene.triggerPostProcessAnimation("hit", scene.hitVignetteAnimation)
        var audio = new Audio('audio/punch.wav');
        audio.volume = 0.4;
        audio.play();
    }

    send_this_take_damage(amount: number) {
        wsClient.send(
            JSON.stringify({
                route: serverMessages.DAMAGE_PLAYER,
                content: JSON.stringify({ username: this.name, damage: amount })
            }))
    }

    healthSet(newHealth: number | undefined): number {
        let hs = super.healthSet(newHealth)
        if (this.currentHealth <= 0) {
            this.takeHits = false
            if (this === sphere1) {
                this.update_status("Dying", false, true)
                var audio = new Audio('audio/fall-death.mp3');
                audio.volume = 0.8;
                audio.play();
                setTimeout(() => { if (scene) scene.triggerPostProcessAnimation("fadin", scene.fadinVignetteAnimation) }, 3000)
                setTimeout(() => { if (this) this.spawn() }, 8000)
            }
        }
        return hs
    }

    spawn() {
        this.healthSet(this.maxHealth)
        this.takeHits = true
        const xPos = 0 + Math.random() * 20
        const zPos = 0 + Math.random() * 20
        let spawnPosHeight = scene.getHeightAtPoint(xPos, zPos)
        this.shape.setAbsolutePosition(
            new Vector3(
                xPos,
                spawnPosHeight ? spawnPosHeight + 2 : 2,
                zPos))
        this.update_status("Idle", true, true)
    }

    underwater(isUnder: boolean) {
        if (isUnder == true) {
            if (this.getStatus() !== "Swimming") this.update_status("Swimming")
            this.oxygen--
            if (this.oxygen <= 0 && this.currentHealth > 0) this.healthSet(0)
        } else {
            this.oxygen = 300
            if (this.getStatus() === "Swimming") this.update_status("Idle", true, true)
        }
    }

    update_status(new_status: CharacterStatus, loopAnim?: boolean, force?: boolean): void {
        let currStatus = this.getStatus()
        if (currStatus === new_status) return
        if (this.glider) {
            if (currStatus === "Gliding") this.glider.deployGlider(false)
            else if (new_status === "Gliding") this.glider.deployGlider(true)
        }
        super.update_status(new_status, loopAnim, force)
    }

    switchGlide() {
        if (!this.glider) return
        this.glider.switchGlide()
    }
}
