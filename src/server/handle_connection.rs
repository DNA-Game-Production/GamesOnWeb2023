use std::{collections::HashMap, net::SocketAddr};

use futures_channel::mpsc::unbounded;
use futures_util::{future, pin_mut, stream::TryStreamExt, StreamExt};
use rand::seq::SliceRandom;
use serde::Deserialize;
use serde_json::{self};
use tokio::net::TcpStream;
use tungstenite::protocol::Message;

use crate::{
    server::{
        game_events::monster::{clear_all_monsters, monster_spawner},
        utils,
    },
    Direction, MonsterList, PeerMap, PositionUpdates, SharedMessages,
};

#[derive(Deserialize, Debug)]
struct DamageData {
    username: String,
    damage: i16,
}

#[derive(Deserialize, Debug)]
struct MoveMonsterData {
    username: String,
    pos_x: f32,
    pos_y: f32,
    pos_z: f32,
    direction: String,
    status: String,
}

#[derive(Deserialize, Debug)]
struct SpawnMonsterData {
    pos_x: f32,
    pos_y: f32,
    pos_z: f32,
    username: String,
    direction: String,
    health: i16,
}

pub async fn handle_connection(
    peer_map: PeerMap,
    raw_stream: TcpStream,
    addr: SocketAddr,
    shared_messages: SharedMessages,
    position_list: PositionUpdates,
    monster_list: MonsterList,
    monster_action: SharedMessages,
) {
    println!("Incoming TCP connection from: {}", addr);

    let ws_stream = tokio_tungstenite::accept_async(raw_stream)
        .await
        .expect("Error during the websocket handshake occurred");
    println!("WebSocket connection established: {}", addr);

    // Insert the write part of this peer to the peer map.
    let (tx, rx) = unbounded();
    peer_map.lock().unwrap().insert(addr, tx.clone());

    let (outgoing, incoming) = ws_stream.split();

    let mut username = String::new();
    let colors = vec!["red", "blue", "orange", "green", "purple"];
    let color = *colors.choose(&mut rand::thread_rng()).unwrap();

    let broadcast_incoming = incoming.try_for_each(|msg| {
        //if the message is a keepalive, we do nothing
        if msg.to_text().unwrap() == "keepalive" {
            println!("Keep alive from {}", addr)
        }
        //print the message in server and add it to the message stack
        else {
            let msg_text = msg.to_text().unwrap();

            // println!("Received a message from {}: {}", addr, msg_text);

            let json_res: Result<serde_json::Value, serde_json::Error> =
                serde_json::from_str(msg_text);

            match json_res {
                Ok(json) => {
                    match json["route"].as_str().expect("not a string") {
                        //login and message route
                        "message" => {
                            let color_field =
                                HashMap::from([(String::from("color"), String::from(color))]);
                            let return_json = utils::merge(&json, &color_field);
                            let return_message = return_json.to_string();
                            shared_messages
                                .lock()
                                .unwrap()
                                .push(Message::Text(return_message));
                        }
                        "player_hit" => {
                            shared_messages.lock().unwrap().push(msg.clone());
                        }
                        "ping" => {
                            //send back the user's ping, for connection testing
                            tx.unbounded_send(msg.clone()).unwrap();
                        }
                        "login" => {
                            //set the username value
                            match json["content"].as_str() {
                                Some(string) => {
                                    if position_list
                                        .lock()
                                        .unwrap()
                                        .contains_key(&String::from(string))
                                    {
                                        println!("username already taken, sending a new one");
                                        username = String::from(utils::generate_random_string());
                                        //send to the client his new username
                                        let username_message = format!(
                                            r#" {{"route": "usernameSetter", "content": "{}"}} "#,
                                            username
                                        );
                                        tx.unbounded_send(Message::from(username_message)).unwrap();
                                    } else {
                                        username = String::from(string);
                                    }
                                }
                                None => {
                                    username = String::from(utils::generate_random_string());
                                    //send to the client his new username
                                    let username_message = format!(
                                        r#" {{"route": "usernameSetter", "content": "{}"}} "#,
                                        username
                                    );
                                    tx.unbounded_send(Message::from(username_message)).unwrap();
                                }
                            };

                            let login_message =
                                format!(r#" {{"route": "login", "content": "{}"}} "#, username);

                            shared_messages
                                .lock()
                                .unwrap()
                                .push(Message::from(login_message));
                        }
                        "position" => {
                            position_list
                                .lock()
                                .unwrap()
                                .insert(username.clone(), msg.clone().to_string());
                        }
                        "kill_all_night_monster" => {
                            clear_all_monsters(monster_list.clone());
                            shared_messages.lock().unwrap().push(msg.clone());
                        }
                        "damage_monster" => {
                            let damage_data: DamageData =
                                serde_json::from_str(json["content"].as_str().unwrap()).unwrap();
                            println!("{:?}", damage_data);
                            let mut monster_list = monster_list.lock().unwrap();
                            let new_data = monster_list.get_mut(&damage_data.username);
                            match new_data {
                                Some(new_data) => {
                                    new_data.health -= damage_data.damage;

                                    if new_data.health <= 0 {
                                        new_data.health = 0;
                                        let kill_monster_message = format!(
                                            r#" {{"route": "kill_monster", "content": "{}"}} "#,
                                            new_data.username
                                        );
                                        shared_messages
                                            .lock()
                                            .unwrap()
                                            .push(Message::from(kill_monster_message));
                                        monster_list.remove(&damage_data.username);
                                    }
                                }
                                None => {
                                    println!("ERROR: TRIED TO DAMAGE A ZOMBIE THAT DOES NOT EXIST");
                                }
                            }
                        }
                        "remove_plant" => {
                            shared_messages.lock().unwrap().push(msg.clone());
                            println!("!!!!!!!!! received remove_plant route")
                        }
                        "damage_player" => {
                            shared_messages.lock().unwrap().push(msg.clone());
                            println!("!!!!!!!!! received damage_player route")
                        }
                        "move_monster" => {
                            let move_data: MoveMonsterData =
                                serde_json::from_str(json["content"].as_str().unwrap()).unwrap();
                            println!("{:?}", move_data);
                            update_position(move_data, monster_list.clone());
                        }
                        "position_monster_list" => {
                            let content: Vec<String> =
                                serde_json::from_str(json["content"].as_str().unwrap()).unwrap();
                            for position in content {
                                let move_data: MoveMonsterData =
                                    serde_json::from_str(&position).unwrap();
                                // println!("{:?}", move_data);
                                update_position(move_data, monster_list.clone());
                            }
                        }
                        "monster_hit" => {
                            // println!("MONSTER HIT ROUTE RECEIVED");
                            monster_action.lock().unwrap().push(msg.clone());
                        }
                        "knockback_monster" => {
                            println!("KNOCKBACK ROUTE RECEIVED");
                            shared_messages.lock().unwrap().push(msg.clone());
                        }
                        "spawn_monster" => {
                            println!("SPAWN MONSTER ROUTE RECEIVED");
                            let spawn_data: SpawnMonsterData =
                                serde_json::from_str(json["content"].as_str().unwrap()).unwrap();
                            monster_spawner(
                                spawn_data.pos_x,
                                spawn_data.pos_y,
                                spawn_data.pos_z,
                                spawn_data.username,
                                spawn_data.direction,
                                spawn_data.health,
                                monster_list.clone(),
                            )
                        }
                        //keep alive route, does nothing
                        "keepalive" => {}
                        //invalid route not matching any of the previous patterns
                        s => println!("the message's route attribute: {} is not valid.", s),
                    }
                }
                Err(_) => {
                    println!("message text {} can't be converted to JSON", msg_text);
                }
            }
        }
        future::ok(())
    });

    let receive_from_others = rx.map(Ok).forward(outgoing);

    pin_mut!(broadcast_incoming, receive_from_others);
    future::select(broadcast_incoming, receive_from_others).await;

    println!("{} disconnected", &addr);

    //send a message in the chat to let chaters know this user was disconnected
    let logout_message = format!(r#" {{"route": "logout", "content": "{}"}} "#, username);
    shared_messages
        .lock()
        .unwrap()
        .push(Message::Text(logout_message.to_string()));

    //remove the user from the list of connections
    peer_map.lock().unwrap().remove(&addr);

    //remove the user from the position Hashmap
    position_list.lock().unwrap().remove(&username);
}

fn update_position(move_data: MoveMonsterData, monster_list: MonsterList) {
    let direction: Direction = serde_json::from_str(&move_data.direction).unwrap();
    let mut monster_list = monster_list.lock().unwrap();
    let new_data = monster_list.get_mut(&move_data.username);
    match new_data {
        Some(new_data) => {
            new_data.pos_x = move_data.pos_x;
            new_data.pos_y = move_data.pos_y;
            new_data.pos_z = move_data.pos_z;
            new_data.direction = format!(
                r#" {{\"_isDirty\":{},\"_x\":{},\"_y\":{},\"_z\":{}}} "#,
                direction._isDirty, direction._x, direction._y, direction._z
            );
            new_data.status = move_data.status;
        }
        None => {
            println!("ERROR: TRIED TO MOVE A ZOMBIE THAT DOES NOT EXIST");
        }
    }
}
