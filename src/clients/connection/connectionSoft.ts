import { Scene, Vector3 } from "babylonjs"
import { AvatarSoft } from "../babylon/avatars/avatarSoft"
import { PLAYER_CLASSES_TYPE } from "../babylon/avatars/classes/classesTypes"
import { CharacterStatus } from "../babylon/avatars/classes/intrinsicProp"
import { Plant } from "../babylon/avatars/classes/monsters/plant"

export const serverMessages = {
    SET_USERNAME: "usernameSetter",
    PING: "ping",
    LOGIN: "login",
    LOGOUT: "logout",
    MESSAGE: "message",
    POSITION: "position",
    POSITION_LIST: "position_player_list",
    MONSTER_DATA: "monster_data",
    KILL_MONSTER: "kill_monster",
    KILL_ALL_NIGHT_MONSTER: "kill_all_night_monster",
    MOVE_MONSTER: "move_monster",
    DAMAGE_MONSTER: "damage_monster",
    REMOVE_PLANT: "remove_plant",
    DAMAGE_PLAYER: "damage_player",
    HOUR: "hour",
    SPAWN_MONSTER: "spawn_monster",
    MONSTER_HIT: "monster_hit",
    PLAYER_HIT: "player_hit",
    MONSTER_POSITION_LIST: "position_monster_list",
    KNOCKBACK_MONSTER: "knockback_monster"
}

export type receiveContent = {
    pos_x: number, pos_y: number, pos_z: number,
    username: string, direction: Vector3, class: PLAYER_CLASSES_TYPE, ydiroffset: number,
    health?: number, maxHealth?: number,
    status?: CharacterStatus
}

export type knockbackContent = {
    username: string, direction: Vector3, power: number
}

export type position = { pos_x: number, pos_y: number, pos_z: number, }


export abstract class ConnectionSoft<T extends AvatarSoft, S extends AvatarSoft, Q extends AvatarSoft, R extends Scene> extends WebSocket {
    player_list: Map<string, T>
    monster_list: Map<string, S>
    plant_list: Map<string, Q>
    scene?: R;

    constructor(url: string, scene?: R) {
        super(url)
        this.onopen = this.onOpen
        this.onerror = this.onError;
        this.player_list = new Map<string, T>();
        this.monster_list = new Map<string, S>();
        this.plant_list = new Map<string, Q>();
        this.scene = scene;
    }

    abstract onOpen(evt?: Event): any;
    abstract onError(): any;

    setEventListener() {
        console.log("Setting event listener");

        this.addEventListener('message', event => {
            let messageReceived = JSON.parse(event.data);

            switch (messageReceived.route) {
                case serverMessages.PING: {
                    this.ping()
                    break;
                }

                case serverMessages.LOGIN: {
                    this.login(messageReceived)
                    break;
                }

                case serverMessages.SET_USERNAME: {
                    this.set_username(messageReceived)
                    break;
                }

                //logout route: dispose player's avatar, remove player's entry in the player_list map
                case serverMessages.LOGOUT: {
                    this.logout(messageReceived)
                    break;
                }

                //message route: write the message content in the chat if the sender isn't us
                case serverMessages.MESSAGE: {
                    this.message(messageReceived)
                    break;
                }

                //position: add the player if they aren't in our list yet, move the avatar to the input position
                case serverMessages.POSITION: {
                    this.position(messageReceived)
                    break;
                }

                case serverMessages.POSITION_LIST: {
                    this.position_list(messageReceived);
                    break;
                }

                //monster_data: update the monster's data
                case serverMessages.MONSTER_DATA: {
                    this.monster_data(messageReceived)
                    break;
                }

                case serverMessages.MONSTER_POSITION_LIST: {
                    this.monster_position_list(messageReceived);
                    break;
                }

                //avatar_hit: the avatar fires a hit
                case serverMessages.PLAYER_HIT: {
                    this.player_hit(messageReceived)
                    break;
                }

                //monster_hit: the monster try to hit players
                case serverMessages.MONSTER_HIT: {
                    this.monster_hit(messageReceived)
                    break;
                }

                //kill_monster: kill the monster with passed username
                case serverMessages.KILL_MONSTER: {
                    this.kill_monster(messageReceived)
                    break;
                }

                //kill_monster: kill the monster with passed username
                case serverMessages.REMOVE_PLANT: {
                    this.remove_plant(messageReceived)
                    break;
                }

                //kill_monster: kill the monster with passed username
                case serverMessages.KILL_ALL_NIGHT_MONSTER: {
                    this.kill_all_night_monster(messageReceived)
                    break;
                }

                //knockback_monster: push the monster in the target direction
                case serverMessages.KNOCKBACK_MONSTER: {
                    this.knockback_monster(messageReceived)
                    break;
                }

                //route fireBullet: fireBullet with sender's avatar if the ender is not ourselves
                // case serverMessages.ATTACK_0: {
                //     this.attack_0(messageReceived)
                //     break;
                // }

                case serverMessages.HOUR: {
                    this.hour(messageReceived)
                    break;
                }

                case serverMessages.DAMAGE_PLAYER: {
                    this.damage_player(messageReceived)
                    break;
                }

                //default: the route received does not exist. Should not happen, look for debugging!
                default: throw new Error("Error : this functionality is to be implemented")
            }
        })
    }

    ping() {
    }

    /**
     * logout route: dispose player's avatar, remove player's entry in the player_list map
     * @param messageReceived 
     */
    logout(messageReceived: any) {
        let avatar_to_disconnect = this.player_list.get(messageReceived.content);
        if (avatar_to_disconnect !== undefined) avatar_to_disconnect.dispose();
        this.player_list.delete(messageReceived.content);
        console.log("LOGIN OUT: " + messageReceived.content);
    }

    /**
     * login route: create avatar, link the new avatar with its user in the player_list, set my sphere if I'm the one who logged in
     * @param messageReceived 
     */
    abstract login(messageReceived: any): void;

    /**
     * kill_monster: kill the monster with passed username
     * @param messageReceived 
     */
    kill_monster(messageReceived: any) {
        let monster_to_kill = this.monster_list.get(messageReceived.content);
        if (monster_to_kill !== undefined) monster_to_kill.dispose();
        this.monster_list.delete(messageReceived.content);
    }

    /**
     * kill_plant: kill the plant with passed username
     * @param messageReceived 
     */
    remove_plant(messageReceived: any) {
    }

    /**
     * kill_all_night_monster: kill all current night monster
     * @param messageReceived 
     */
    kill_all_night_monster(messageReceived: any) { }

    abstract set_username(messageReceived: any): void;

    /**
     * message route: write the message content in the chat if the sender isn't us
     * @param messageReceived 
     */
    abstract message(messageReceived: any): void;
    /**
     * monster_data: update the monster's data
     * @param messageReceived 
     */
    abstract monster_data(messageReceived: any): void;

    monster_position_list(messageReceived: any): void {
        //chaque élément de la liste est un message, qu'on envoie à la fonction "monster_data" traitant les actualisation individuelles
        messageReceived.content.forEach((position_update: any) => {
            this.monster_data(JSON.parse(position_update))
        });
    }

    abstract move_monster(messageReceived: any): void;
    abstract damage_monster(messageReceived: any): void;

    damage_player(messageReceived: any) {
        return
    }

    /**
     * route fireBullet: fireBullet with sender's avatar if the ender is not ourselves
     * @param messageReceived 
     */
    // abstract attack_0(messageReceived: any): void;

    /**
     * position: add the player if they aren't in our list yet, move the avatar to the input position
     * @param messageReceived 
     */
    abstract position(messageReceived: any): void;

    position_list(messageReceived: any): void {
        //chaque élément de la liste est un message, qu'on envoie à la fonction "position" traitant les actualisation individuelles de position
        messageReceived.content.forEach((position_update: any) => {
            this.position(JSON.parse(position_update))
        });
    }

    abstract hour(messageReceived: any): void;
    abstract spawn_monster(messageReceived: any): void;

    /**
     * player_hit: the player fire corresponding hit
     * @param messageReceived 
     */
    abstract player_hit(messageReceived: any): void;

    /**
     * monster_hit: the monster try to hit players
     * @param messageReceived 
     */
    abstract monster_hit(messageReceived: any): void;

    abstract knockback_monster(messageReceived: any): void;
}