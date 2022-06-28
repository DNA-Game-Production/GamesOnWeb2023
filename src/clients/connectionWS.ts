import { Animation, Axis, Mesh, Vector3 } from "babylonjs";
import { Avatar } from "./babylon/avatars/avatar";
import { Monster } from "./babylon/avatars/monster";
import { Player } from "./babylon/avatars/player";
import { initFunction, scene, setScene, set_my_sphere } from "./babylon/main";
import { updateHour } from "./babylon/time";
import { getTime, isVector3Equal, makeid } from "./babylon/tools";
import { chatRef, initChat } from "./reactComponents/chat";
import { askUsername } from "./reactComponents/login";
import { ErrorNoServer } from "./reactComponents/noServer";

export var ws: WebSocket;
export var player_list: Map<string, Player> = new Map();
export var night_monster_list: Map<string, Monster> = new Map();
export var username: string;
export var meshes: Mesh[] = [];

export const serverMessages = {
    SET_USERNAME: "usernameSetter",
    LOGIN: "login",
    LOGOUT: "logout",
    MESSAGE: "message",
    POSITION: "position",
    MONSTER_DATA: "monster_data",
    KILL_MONSTER: "kill_monster",
    MOVE_MONSTER: "move_monster",
    DAMAGE_MONSTER: "damage_monster",
    FIRE_BULLET: "fireBullet",
    HOUR: "hour",
    SPAWN_MONSTER: "spawn_monster",
    MONSTER_HIT: "monster_hit"
}

type position = { pos_x: number, pos_y: number, pos_z: number, }

export type receiveContent = {
    pos_x: number, pos_y: number, pos_z: number,
    username: string, direction: Vector3, health?: number, maxHealth?: number
}

export function connect_to_ws() {

    // !!!!!! CHANGE COMMENTED LINE TO CONNECT TO HEROKU BEFORE PUSHING A BUILD !!!!! \\
    //first line is to connect on a local server for testing, second is to connect on the heroku server

    //RUNNING SERVER ON LOCAL FOR DEV
    ws = new WebSocket("ws://127.0.0.1:8080");

    // RUNNING SERVER ON HEROKU FOR DEPLOYMENT
    // ws = new WebSocket("wss://mmoactiongameserver.herokuapp.com/");

    ws.onerror = () => {
        ErrorNoServer()
    };


    //we start our request process when the connection is established
    ws.onopen = (e) => {
        //Ask username to user and removes " and ' characters. If user fails to give a username, give them a random id
        askUsername()
    };

    // setTimeout(() => {
    //     setUsername();
    //     setSocketMessageListener();
    // },
    //     100);

}

//login to the server with the given username
function setUsername() {
    ws.send(
        JSON.stringify(
            {
                route: serverMessages.LOGIN,
                content: username
            }));
}

//our websocket listen to incoming messages
function setSocketMessageListener() {
    //procedure on messages received from server
    ws.addEventListener('message', function (event) {
        //console.log(event.data);
        let messageReceived = JSON.parse(event.data);
        switch (messageReceived.route) {

            //login route: create avatar, link the new avatar with its user in the player_list, set my sphere if I'm the one who logged in
            case serverMessages.LOGIN: {
                var sphere = new Player(scene, messageReceived.content, username);
                var sender_name = messageReceived.content;
                player_list.set(sender_name, sphere);
                if (sender_name === username) {
                    set_my_sphere();
                    setPositionUpdateSender()
                }
                console.log("LOGIN IN: " + messageReceived.content);
                chatRef.current!.displayStatusInChat(getTime(), messageReceived.content, true);
                break;
            }

            case serverMessages.SET_USERNAME: {
                console.log("USERNAME UPDATED FROM " + username + " TO " + messageReceived.content);
                username = messageReceived.content;
                break;
            }

            //logout route: dispose player's avatar, remove player's entry in the player_list map
            case serverMessages.LOGOUT: {
                let avatar_to_disconnect = player_list.get(messageReceived.content);
                if (avatar_to_disconnect !== undefined) avatar_to_disconnect.dispose();
                player_list.delete(messageReceived.content);
                console.log("LOGIN OUT: " + messageReceived.content);
                chatRef.current!.displayStatusInChat(getTime(), messageReceived.content, false);
                break;
            }

            //message route: write the message content in the chat if the sender isn't us
            case serverMessages.MESSAGE: {
                let messageContent = JSON.parse(messageReceived.content);
                if (messageContent.username === username) break;
                chatRef.current!.writeMessageInChat(messageContent.time, messageContent.username, messageContent.message, false);
                break;
            }

            //position: add the player if they aren't in our list yet, move the avatar to the input position
            case serverMessages.POSITION: {
                let messageContent: receiveContent = JSON.parse(messageReceived.content);
                avatar_update_from_serveur(messageContent, player_list, 50);
                break;
            }

            //monster_data: update the monster's data
            case serverMessages.MONSTER_DATA: {
                let messageContent: receiveContent = JSON.parse(messageReceived.content);
                avatar_update_from_serveur(messageContent, night_monster_list, 500, true);
                let d = new Date();
                if (messageContent.username == "zombie0") console.log("received z0 update: " + d.getMilliseconds());
                break;
            }

            //monster_hit: the monster try to hit players
            case serverMessages.MONSTER_HIT: {
                let messageContent = JSON.parse(messageReceived.content);
                console.log("monster hits: " + messageContent.username + ", hitmode: " + messageContent.hitmode);
                let monster = night_monster_list.get(messageContent.username);
                if (monster) monster.hit(messageContent.hitmode);
                else console.log("monster " + messageContent.username + "tried to hit but doesn't exist");

            }

            //kill_monster: kill the monster with passed username
            case serverMessages.KILL_MONSTER: {
                let monster_to_kill = night_monster_list.get(messageReceived.content);
                console.log(monster_to_kill, messageReceived.content, night_monster_list);

                if (monster_to_kill !== undefined) monster_to_kill.dispose();
                night_monster_list.delete(messageReceived.content);
                break;
            }

            //route fireBullet: fireBullet with sender's avatar if the ender is not ourselves
            case serverMessages.FIRE_BULLET: {
                if (messageReceived.content !== username) {
                    let firing_player = player_list.get(messageReceived.content)
                    if (firing_player) {
                        firing_player.addBullet(true);
                    }
                }
                break;
            }

            case serverMessages.HOUR: {
                updateHour(messageReceived.content)
                break;
            }

            //default: the route received does not exist. Should not happen, look for debugging!
            default: console.log("received a message from server with an invalid route: " + messageReceived.route);
        }
    })
}

//the client regularly send its player's position
function setPositionUpdateSender() {
    let player: Avatar | undefined;
    if (username && (player = player_list.get(username))) sendPosition(player);
    setInterval(() => {
        let player: Avatar | undefined;
        if (username && (player = player_list.get(username)) && (player.didSomething || !isVector3Equal(player.oldPosition, player.position))) {
            sendPosition(player);
            player.oldPosition = player.position.clone()
        }
    },
        50);
}

function sendPosition(player: Avatar) {
    player.computeWorldMatrix(true);
    player.didSomething = false;
    var position_player = JSON.stringify({
        pos_x: player.position.x,
        pos_y: player.position.y,
        pos_z: player.position.z,
        username: username,
        health: player.currentHealth,
        maxHealth: player.maxHealth,
        direction: player.getDirection(Axis.Z)
    })

    //console.log("sending " + position_player);

    ws.send(
        JSON.stringify({
            route: serverMessages.POSITION,
            content: position_player
        }))
}

export function sendMessage(time: string, msg: string) {
    var message_player = JSON.stringify({
        username: username,
        time: time,
        message: msg
    })

    ws.send(
        JSON.stringify({
            route: serverMessages.MESSAGE,
            content: message_player
        }))
}

export function objToPosition({ position }: Mesh): position {
    return { pos_x: position.x, pos_y: position.y, pos_z: position.y }
}

export function avatar_update_from_serveur(data: receiveContent, list: Map<String, Avatar>, time_ms: number, isMonster: boolean = false) {
    //We parse the message's content to get something of the form:
    //{pos_x: int, pos_y: int, pos_z: int, username: string}
    if (data.username === username && list === player_list) return

    //We find the avatar linked to the username in our list parameter map
    let avatar_to_update = list.get(data.username);

    //if we found nothing, we add the username in the list parameter map, and associate it with a new avatar
    if (avatar_to_update === undefined) {
        console.log("failed to find name " + data.username + " in list " + list + ", adding him.");
        list.set(
            data.username,
            isMonster ?
                new Monster(scene, data.username, username, {
                    health: {
                        maxHealth: data.maxHealth,
                        currentHealth: data.health
                    }
                })
                : new Player(scene, data.username, username, {
                    health: {
                        maxHealth: data.maxHealth,
                        currentHealth: data.health
                    }
                }));
        avatar_to_update = list.get(data.username);
        if (avatar_to_update) avatar_to_update.position = new Vector3(data.pos_x, data.pos_y, data.pos_z);
    }

    if (avatar_to_update?.name == "zombie0") {
        console.log("current position: " + avatar_to_update.position);
        console.log("received pos: " + data.pos_x + ", " + data.pos_y + ", ", + data.pos_z);
    }

    //avatar_to_move should now be affected and we can give it the new position
    if (avatar_to_update) {
        if (avatar_to_update.position.x !== data.pos_x || avatar_to_update.position.y !== data.pos_y || avatar_to_update.position.z !== data.pos_z) {
            if (avatar_to_update.name == "zombie0") console.log("starting move anim for z0");
            Animation.CreateAndStartAnimation("animMove", avatar_to_update, "position", 60, Math.floor(0.7 * time_ms), avatar_to_update.position, new Vector3(data.pos_x, data.pos_y, data.pos_z), Animation.ANIMATIONLOOPMODE_CONSTANT);
        }


        let target = avatar_to_update.position.add(data.direction);
        avatar_to_update.lookAt(target);

        avatar_to_update.computeWorldMatrix(true)


        //update the avatar health to the data received
        let health = data.health
        avatar_to_update.healthSet(health)

    }
    //for debugging, should NOT happen ever
    else { console.log("WTF???????") }
}

export function establishConnection(name: string) {
    var username_entry = name;
    var formatted_username_entry = username_entry?.replace(/["']/g, "");
    username = formatted_username_entry ? formatted_username_entry : "";

    if (username.length > 12) {
        username = username.slice(0, 12);
    }

    if (username === "") {
        username = makeid(10);
    }
    console.log("connection successfully established!");
    setUsername();
    setSocketMessageListener();
    initChat()
    initFunction().then(e => {
        setScene(e)
        scene.collisionsEnabled = true
    });
}
