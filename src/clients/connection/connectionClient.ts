import { Animation, Axis, Mesh, Vector3 } from "babylonjs";
import { refReactMain } from "../../indexClient";
import { Avatar } from "../babylon/avatars/avatarHeavy";
import { PLAYER_CLASSES_TYPE } from "../babylon/avatars/classes/classesTypes";
import { Player } from "../babylon/avatars/classes/heroes/player";
import { Monster } from "../babylon/avatars/classes/monsters/monster";
import { Plant } from "../babylon/avatars/classes/monsters/plant";
import { initFunction, scene, setScene, set_my_sphere, sphere1 } from "../babylon/main";
import { updateHour } from "../babylon/others/time";
import { getTimeToString, isVector3Equal, makeId, playerClassCreator } from "../babylon/others/tools";
import { SceneClient } from "../babylon/scene/sceneClient";
import { chatRef } from "../reactComponents/main";
import { ConnectionSoft, position, receiveContent, serverMessages } from "./connectionSoft";
import { SERVER_LINK } from "./server_address";

export var username: string;
export var playerClass: PLAYER_CLASSES_TYPE = "Mage";
export var meshes: Mesh[] = [];

export let wsClient: ConnectionClient;

export class ConnectionClient extends ConnectionSoft<Player, Monster, Plant, SceneClient> {
    timeSendPing: number;
    constructor() {
        super(SERVER_LINK);
        this.timeSendPing = 0;
    }

    onOpen(evt?: Event | undefined) {
        console.log("Opening");
        //GET THE PING BETWEEN CLIENT AND SERVER (CURRENTLY 1 PING RIGHT AFTER CONNECTION IS INITIALIZED, DISPLAY PING IN CONSOLE)
        wsClient.timeSendPing = Date.now()
        wsClient.send(
            JSON.stringify({
                route: serverMessages.PING,
                content: username
            })
        )
    }

    onError() {
        refReactMain.current!.setSection("NO_SERVER")
    }

    set_username(messageReceived: any): void {
        console.log("USERNAME UPDATED FROM " + username + " TO " + messageReceived.content);
        username = messageReceived.content;
    }

    ping(): void {
    }

    login(messageReceived: any): void {
        var sender_name = messageReceived.content;
        if (sender_name === username) {
            var sphere = playerClassCreator(playerClass, username)
            this.player_list.set(sender_name, sphere);
            set_my_sphere();
            setPositionUpdateSender()
        }
        console.log("LOGIN IN: " + messageReceived.content);
        chatRef.current!.displayStatusInChat(getTimeToString(), messageReceived.content, "Login");
    }

    logout(messageReceived: any): void {
        chatRef.current!.displayStatusInChat(getTimeToString(), messageReceived.content, "Logout");
        super.logout(messageReceived)
    }

    message(messageReceived: any): void {
        let messageContent = JSON.parse(messageReceived.content);
        if (messageContent.username !== username)
            chatRef.current!.writeMessageInChat(messageContent.time, messageContent.username, messageContent.message, "OtherPlayerMsg");
    }

    monster_data(messageReceived: any): void {
        let messageContent: receiveContent = JSON.parse(messageReceived.content);
        avatar_update_from_server(messageContent, this.monster_list, 100, true);
    }

    kill_monster(messageReceived: any) {
        let monster_to_kill = this.monster_list.get(messageReceived.content);
        this.monster_list.delete(messageReceived.content);
        if (monster_to_kill) {
            monster_to_kill.healthSet(0)
            monster_to_kill.update_status("Dying", false, true)
            monster_to_kill.takeHits = false
            setTimeout(() => {
                if (monster_to_kill !== undefined) monster_to_kill.dispose();
            }, 4000)
        }
    }

    /**
     * kill_plant: kill the plant with passed username
     * @param messageReceived 
     */
    remove_plant(messageReceived: any) {
        console.log("plant to kill username: " + messageReceived.content);
        let plant_to_kill = this.plant_list.get(messageReceived.content);
        console.log("plant to kill: " + plant_to_kill);

        let plant_position = plant_to_kill?.shape.position;
        console.log("plant_position" + plant_position);

        if (plant_to_kill !== undefined) plant_to_kill.dispose();
        this.plant_list.delete(messageReceived.content);

        console.log("plant_position" + plant_position);

        setTimeout(() => {
            console.log("TIMEOUT PLANT RESPAWN");
            console.log("plant_position" + plant_position + "scene" + scene);
            if (scene && plant_position) {
                console.log("ENTER IF");
                this.plant_list.get(messageReceived.content)?.dispose()
                let plantRespawn = new Plant(scene, messageReceived.content, plant_position)
                this.plant_list.set(messageReceived.content, plantRespawn)
            }
        }, 10000)
    }

    kill_all_night_monster(messageReceived: any) {
        for (const value of wsClient.monster_list.values()) {
            value.dispose();
        }
        wsClient.monster_list.clear();
    }

    move_monster(messageReceived: any): void {
    }

    damage_monster(messageReceived: any): void {
    }

    damage_player(messageReceived: any): void {
        let messageContent = JSON.parse(messageReceived.content)
        if (sphere1 && messageContent.username === sphere1.name) {
            console.log("you take damage because other player hit you with " + messageContent.damage + "dmg");

            sphere1.take_damage(sphere1.shape.position, messageContent.damage, 0)
        }
    }

    knockback_monster(messageReceived: any): void {
    }

    position(messageReceived: any): void {
        let messageContent: receiveContent = JSON.parse(messageReceived.content);
        avatar_update_from_server(messageContent, this.player_list, 50);
    }

    hour(messageReceived: any): void {
        updateHour(parseInt(messageReceived.content))
    }

    spawn_monster(messageReceived: any): void {
    }

    player_hit(messageReceived: any): void {
        let messageContent = JSON.parse(messageReceived.content);
        let avatar = wsClient.player_list.get(messageContent.username)
        if (avatar) avatar.hit(messageContent.hitmode, true);
    }

    monster_hit(messageReceived: any): void {
        let messageContent = JSON.parse(messageReceived.content);
        let monster = wsClient.monster_list.get(messageContent.username)
        //timeout to sync attack with the position of attack TODO use varriable instead of 100
        if (monster) {
            console.log("monster hit");
            monster.hit(messageContent.hitmode);
        }

    }

    static setGlobalWebSocket(className: PLAYER_CLASSES_TYPE, playerName: string): void {
        wsClient = new ConnectionClient();
        establishConnection(className, playerName);
    }
}



//login to the server with the given username
export function sendLogin() {
    console.log("sending login to server");
    wsClient.send(
        JSON.stringify(
            {
                route: serverMessages.LOGIN,
                content: username
            }));
}


//the client regularly send its player's position
function setPositionUpdateSender() {
    let player: Avatar | undefined;
    if (username && (player = wsClient.player_list.get(username))) sendPosition(player);
    setInterval(() => {
        let player: Avatar | undefined;
        if (username && (player = wsClient.player_list.get(username)) && (player.didSomething || !isVector3Equal(player.oldPosition, player.shape.position))) {
            sendPosition(player);
            player.oldPosition = player.shape.position.clone()
        }
    },
        50);
}

function sendPosition(player: Avatar) {
    player.shape.computeWorldMatrix(true);
    player.didSomething = false;
    var info_player = JSON.stringify({
        pos_x: player.shape.position.x,
        pos_y: player.shape.position.y,
        pos_z: player.shape.position.z,
        username: username,
        health: player.currentHealth,
        maxHealth: player.maxHealth,
        direction: player.shape.getDirection(Axis.Z),
        class: player.class,
        ydiroffset: player.offset_dir_y,
        status: player.getStatus()
    })

    //console.log("sending " + position_player);

    wsClient.send(
        JSON.stringify({
            route: serverMessages.POSITION,
            content: info_player
        }))
}

export function sendMessage(time: string, msg: string) {
    var message_player = JSON.stringify({
        username: username,
        time: time,
        message: msg
    })

    wsClient.send(
        JSON.stringify({
            route: serverMessages.MESSAGE,
            content: message_player
        }))
}

export function objToPosition({ position }: Mesh): position {
    return { pos_x: position.x, pos_y: position.y, pos_z: position.y }
}

export function avatar_update_from_server(data: receiveContent, list: Map<String, Avatar>, time_ms: number, isMonster: boolean = false) {
    //We parse the message's content to get something of the form:
    //{pos_x: int, pos_y: int, pos_z: int, username: string}
    if (data.username === username && list === wsClient.player_list) return

    //We find the avatar linked to the username in our list parameter map
    let avatar_to_update = list.get(data.username);

    //if we found nothing, we add the username in the list parameter map, and associate it with a new avatar
    if (avatar_to_update === undefined) {
        // console.log("failed to find name " + data.username + " in list " + list + ", adding him.");
        list.set(
            data.username,
            isMonster ?
                new Monster(scene, data.username)
                : playerClassCreator(data.class, data.username));
        avatar_to_update = list.get(data.username);
        if (avatar_to_update) {
            avatar_to_update.shape.position = new Vector3(data.pos_x, data.pos_y, data.pos_z);
        }
    }

    //avatar_to_move should now be affected and we can give it the new position
    if (avatar_to_update) {
        if (avatar_to_update.shape.position.x !== data.pos_x || avatar_to_update.shape.position.y !== data.pos_y || avatar_to_update.shape.position.z !== data.pos_z) {
            // console.log("avatar " + avatar_to_update.name + " should move");
            Animation.CreateAndStartAnimation("animMove", avatar_to_update.shape, "position", 60, Math.floor(0.7 * time_ms), avatar_to_update.shape.position, new Vector3(data.pos_x, data.pos_y, data.pos_z), Animation.ANIMATIONLOOPMODE_CONSTANT);
        }


        let target = avatar_to_update.shape.position.add(data.direction);
        avatar_to_update.shape.lookAt(target);

        avatar_to_update.offset_dir_y = data.ydiroffset

        avatar_to_update.shape.computeWorldMatrix(true)

        //update the avatar health to the data received
        let health = data.health
        avatar_to_update.healthSet(health)

        //update the avatar animation and state to the data received
        if (typeof data.status !== 'undefined') {
            avatar_to_update.update_status(data.status, true, true)
        }
    }

    //for debugging, should NOT happen ever
    else { console.log("WTF???????") }
}

export function establishConnection(className: PLAYER_CLASSES_TYPE, name: string) {
    initFunction().then(e => {
        setScene(e)
        scene.collisionsEnabled = true
        var username_entry = name;
        console.log(name);

        var formatted_username_entry = username_entry?.replace(/["']/g, "");
        username = formatted_username_entry ? formatted_username_entry : "";
        playerClass = className

        if (username.length > 12) {
            username = username.slice(0, 12);
        }

        if (username === "") {
            username = makeId(10);
        }
    });
}
