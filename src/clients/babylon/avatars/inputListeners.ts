import { Axis, FollowCamera } from "babylonjs";
import { wsClient } from "../../connection/connectionClient";
import { serverMessages } from "../../connection/connectionSoft";
import { canvas, renderTimeRatio, scene, sphere1 } from "../main";
import { Player } from "./classes/heroes/player";
import { chatRef } from "../../reactComponents/main";

type InputStates = {
    jump: boolean,
    goForward: boolean,
    goLeft: boolean,
    goBackward: boolean,
    goRight: boolean,
    rotateRight: boolean,
    rotateLeft: boolean,
    attack_0: boolean,
    attack_1: boolean,
    run: boolean
}

let createInputStates = (): InputStates => {
    return {
        jump: false,
        goForward: false,
        goLeft: false,
        goBackward: false,
        goRight: false,
        rotateRight: false,
        rotateLeft: false,
        attack_0: false,
        attack_1: false,
        run: false
    }
}

export let inputStates: InputStates;

export function initializeInputListeners() {
    inputStates = createInputStates()

    canvas.addEventListener('keydown', (evt) => {
        keyListener(evt, true)
    });

    canvas.addEventListener('keyup', (evt) => {
        keyListener(evt, false)
    });

    canvas.addEventListener('keydown', (evt) => {
        if ((evt.code === "Enter" || evt.code === "NumpadEnter")) {
            inputStates = createInputStates()
            chatRef.current!.enterChat()
        }
    });

    canvas.addEventListener('mousedown', (evt) => {
        mouseListener(evt, true)
    });

    canvas.addEventListener('mouseup', (evt) => {
        mouseListener(evt, false)
    });

    pointerLockAndMouseMove();
}

function keyListener(evt: KeyboardEvent, isPressed: boolean) {
    // jump
    if (evt.code === "Space") {
        inputStates.jump = isPressed;
        if (isPressed && sphere1 && sphere1.isInAir()) sphere1.switchGlide()
    }
    // movements
    else if (evt.code === "KeyW") {
        inputStates.goForward = isPressed;
    }
    else if (evt.code === "KeyS") {
        inputStates.goBackward = isPressed;
    }
    else if (evt.code === "KeyA") {
        inputStates.goLeft = isPressed;
    }
    else if (evt.code === "KeyD") {
        inputStates.goRight = isPressed;
    }

    else if (evt.code === "ShiftLeft") {
        inputStates.run = isPressed
    }

    // mega jump (development only)
    else if (evt.code === "KeyK") {
        if (sphere1) sphere1.shape.position.y += 10
    }

    //rotation
    else if (evt.code === "ArrowRight") {
        inputStates.rotateRight = isPressed;
    }
    else if (evt.code === "ArrowLeft") {
        inputStates.rotateLeft = isPressed;
    }
}

function mouseListener(evt: MouseEvent, isPressed: boolean) {
    switch (evt.button) {
        case 2:
            inputStates.attack_1 = isPressed;
            break;
        case 0:
            inputStates.attack_0 = isPressed;
            break;
        default:
            break;
    }
}

export function pointerLockAndMouseMove() {
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

    //turret direction is responding to cursor movements
    canvas.addEventListener("mousemove", (evt) => {
        if (sphere1 && sphere1.getStatus() !== "Dying") {
            if (evt.movementX > 0) {
                sphere1.shape.rotate(Axis.Y, Math.sqrt(evt.movementX) / 200);
                sphere1.didSomething = true;
            }
            if (evt.movementX < 0) {
                sphere1.shape.rotate(Axis.Y, - Math.sqrt(-evt.movementX) / 200);
                sphere1.didSomething = true;
            }
        }
        if (scene.activeCamera) {
            var camera = scene.activeCamera as FollowCamera;
            if (evt.movementY < 0) {
                // var bottomRay = new Ray(camera.position, new Vector3(0, -1, 0), 2 + Math.sqrt(-evt.movementY))
                // var bottomHit = scene.pickWithRay(bottomRay, cameraBackCollision)
                // if (!bottomHit?.pickedMesh) {
                camera.heightOffset -= Math.sqrt(-evt.movementY) / 20
                camera.heightOffset = Math.max(-1, camera.heightOffset)
                // }
            }
            if (evt.movementY > 0) {
                camera.heightOffset += Math.sqrt(evt.movementY) / 20
                camera.heightOffset = Math.min(8, camera.heightOffset)

            }
        }
    });

    let isLocked = () => document.pointerLockElement === canvas; // 

    canvas.onpointerdown = function () {
        if (!isLocked()) canvas.requestPointerLock();
    }
}

export function inputEffects(player: Player) {

    if (player.getStatus() === "Dying") return

    if (inputStates.goRight || inputStates.goLeft || inputStates.goBackward || inputStates.goForward || inputStates.rotateRight || inputStates.rotateLeft || inputStates.attack_0)
        player.didSomething = true;

    let direction = player.shape.getDirection(Axis.Z)

    if (player.canMove) {
        //forward/backward movement
        if (inputStates.goForward) {
            if (!player.isInAir()) {
                player.update_status(inputStates.run ? "Running" : "Walking_fw")
            }
            player.shape.moveWithCollisions(direction.scale(player.speed_coeff * renderTimeRatio));
        } else if (inputStates.goBackward) {
            if (!player.isInAir()) {
                player.update_status("Walking_bw")
            }
            player.shape.moveWithCollisions(direction.scale(player.speed_coeff * renderTimeRatio));
        }

        if (
            ((inputStates.goForward || !inputStates.goBackward) && player.getStatus() === "Walking_bw") ||
            (!inputStates.goForward && (player.getStatus() === "Walking_fw" || player.getStatus() === "Running"))
        ) player.update_status("Idle")
    }

    //player rotation
    if (inputStates.rotateRight || inputStates.goRight) {
        player.shape.rotate(Axis.Y, +0.03)
    } else if (inputStates.rotateLeft || inputStates.goLeft) {
        player.shape.rotate(Axis.Y, -0.03)
    }

    //player's attack_0
    if (inputStates.attack_0) {
        // player fires the correspondng hit (not onlyDisplay)
        if (!player.hit("ATTACK_0")) return
        // we send it so server
        wsClient.send(
            JSON.stringify({
                route: serverMessages.PLAYER_HIT,
                content: JSON.stringify({
                    username: player.name,
                    hitmode: "ATTACK_0"
                })
            })
        )
    }

    //player's attack_1
    if (inputStates.attack_1) {
        // player fires the correspondng hit (not onlyDisplay)
        if (!player.hit("ATTACK_1")) return
        // we send it so server
        wsClient.send(
            JSON.stringify({
                route: serverMessages.PLAYER_HIT,
                content: JSON.stringify({
                    username: player.name,
                    hitmode: "ATTACK_1"
                })
            })
        )
    }

    //jump
    if (inputStates.jump) {
        if (player.canJump && player.getStatus() !== "Punching" && player.getStatus() !== "Throw" && player.getStatus() !== "Swimming" && !player.isInAir()) {
            player.isJumping = true;
            player.update_status("Jumping")
            player.canJump = false
            setTimeout(() => {
                player.isJumping = false
                if (player.getStatus() === "Jumping") {
                    player.update_status("Falling")
                    player.updateLastGround()
                }
            }, player.timeJumping)
        }
    }
}
