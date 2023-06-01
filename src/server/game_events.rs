use serde_json::json;
use tokio::time::{sleep, Duration};
use tungstenite::Message;

pub mod monster;

use crate::{server::utils::round, MonsterList, PeerMap, SharedMessages};
use monster::*;

pub async fn game_events(
    peer_map: PeerMap,
    monster_list: MonsterList,
    monster_action: SharedMessages,
) {
    let mut hour = 15.0;

    loop {
        sleep(Duration::from_millis(100)).await;

        //update server hour
        hour = round(hour + 0.02, 2);
        if hour >= 24.00 {
            hour = 0.00;
        }
        if hour % 1.00 == 0.00 {
            println!("hour: {}", hour);
        }

        //build the vector of all positions messages in the monsters' position map
        let mut list_pos_monster = vec![];
        {
            let monster_map = monster_list.lock().unwrap();
            for (_, value) in &*monster_map {
                list_pos_monster.push(monster_message_data(value.clone()));
            }
        }
        //create the message of the list of positions to update
        let monster_position_update_message = format!(
            r#" {{"route": "position_monster_list", "content": {}}} "#,
            json!(list_pos_monster)
        );

        let peers = peer_map.lock().unwrap();
        let broadcast_recipients = peers.iter().map(|(_, ws_sink)| ws_sink);

        //lock to create the iterator on messages
        let mut action_list = vec![];
        {
            let mut actions = monster_action.lock().unwrap();
            for action in &*actions {
                action_list.push(action.clone())
            }
            actions.clear();
        }

        //BROADCAST TO ALL CLIENTS
        for recp in broadcast_recipients {
            //send hour to all clients
            let username_message = format!(r#" {{"route": "hour", "content": "{}"}} "#, hour);
            recp.unbounded_send(Message::from(username_message))
                .unwrap();

            //send updated monster data to all clients
            if hour > 22.0 || hour < 7.0 {
                recp.unbounded_send(Message::from(monster_position_update_message.clone()))
                    .unwrap();
            }

            for action in action_list.clone() {
                recp.unbounded_send(action.clone()).unwrap();
            }
        }
    }
}
