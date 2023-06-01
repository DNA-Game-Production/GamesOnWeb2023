
# <p align="center">[Multiplayer 3D Game](https://DNA-Game-Production.github.io/GamesOnWeb2023/) <font size="4">with [*Babylon.js*](https://www.babylonjs.com/)</font><p>

- [Multiplayer 3D Game with *Babylon.js*](#multiplayer-3d-game-with-babylonjs)
- [The team](#the-team)
- [Goal](#goal)
- [How to play the game](#how-to-play-the-game)
  - [Controls](#controls)
- [History, Details and Difficulties of the Development](#history-details-and-difficulties-of-the-development)
  - [Step 1 : a basic multiplayer game](#step-1--a-basic-multiplayer-game)
  - [Step 2 : Setting our Goals](#step-2--setting-our-goals)
  - [Step 3 : Physics](#step-3--physics)
  - [Step 4 : Creation of the World](#step-4--creation-of-the-world)
  - [Step 5 : Camera movement](#step-5--camera-movement)
  - [Step 6 : performance issues](#step-6--performance-issues)
  - [Step 7 : the monsters](#step-7--the-monsters)
  - [Step 8 : deployement](#step-8--deployement)
  - [Step 9 : finalization](#step-9--finalization)
- [Perspectives](#perspectives)
- [Launch the Game Localy](#launch-the-game-localy)
  
# [Videos](https://www.youtube.com/@d.n.agameproduction6032)


# The team

|                                    FISSORE Davide                                     |                                    BERNIGAUD Noé                                     |
| :-----------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------: |
| <img src="https://zupimages.net/up/23/06/ol5u.png" alt="Fissore Davide" width="200"/> | <img src="https://zupimages.net/up/22/19/dak6.png" alt="BERNIGAUD Noé" width="200"/> |

We are students at the University of Côte d'Azur.
  
- FISSORE Davide was in charge of the menus and UI, the structure of the project, DevOps pipelines and deployment.</li>
- BERNIGAUD Noé was taking care of the rust server, the islands creation, the models and their animations, the game physics, gameplay and sounds.

However, despite our specialization that occurred during the project, we always stayed polyvalent and were able to help each other out whenever someone had a block.

A third student, VENTURELLI Antoine, was originally included in the project and participated in the early versions of the game's logic and physics. Unfortunately, he left the computing science field as well as the project during the first iterations.
  

# Goal 
  The goal of this project was the **creation of a 3D Multiplayer Survival game** with [<b>Babylon.js</b>](https://www.babylonjs.com/) in Spring of 2023 for the Game on Web 2023 contest. The theme was "To Be Green".

# How to play the game

First of all, you can launch the game simply by clicking [this link](https://dna-game-production.github.io/GamesOnWeb2023/). You will be asked to enter a name for your character and you're good to go !

Because of humanity's *greed* and *avidity*, the planet ran out of resources and society collapsed. Your are a survivor who took refuge on an archipelago and have nothing but your will and body to defend yourself. Your goal is to survive the hostile environment and, in particular, monsters that will spawn at night.

This is a multiplayer game, so you might not be the only survivor on the archipelago. Other players live and die by the same rules as you, so choose to cooperate with them in order to become stronger as a group. Or, you could also attack them to make the archipelago your own...

## Controls

- `Z`: walk forward
- `Z + SHIFT`: run forward
- `S`: walk backward
- `Q`: rotate left
- `D`: rotate right
- `move mouse`: rotate
- `Left Mouse Button`: Attack
- `SPACE`: jump
- `SPACE` (while falling): deploy glider
- `ENTER`: open the in-game chat
  

# History, Details and Difficulties of the Development


## Step 1 : a basic multiplayer game

When we look at what the game look like now, it might come as a surprise to know how it started: a glorified mini-chat. We wanted to learn how to program a server since it would be fun to be able to play and test the game we were developing together. At this stage, we *didn't* even precisely know what the game would be like, but we wanted to make a server first to better understand how it works and be able to picture how we could make a multiplayer game.

We decided to realize the server with the `Rust` programming language. None of us knew how to program in `Rust`, but we were interested to learn more about it due to its growing reputation to be a good  server language with a high control, security and performance.

Once the mini-chat was done, we made a rudimentary BabylonJS world where players were able to log in with a custom name. This raw server was now able to receive, store and broadcast players' position.

![First iteration of the game](https://github.com/DNA-Game-Production/GamesOnWeb2023/assets/56736268/0bfb1e62-22fe-4631-adbc-f004dbad3bab)

A **fun issue** we got to experience during our testing was **injection attack**: we could send special characters, HTML tag, or even code in the mini-chat to try to crash the server or even make the server interpret it! It was a rather easy fix but also something amusing to experiment.

Another issue with the server was the **update per second**. We couldn't ask the server to update all players positions for all clients $60$ times per seconds, as it would generate too many requests. On the other hand, a lower update ratio would cause make the players move in an irregular way. Therefore, to avoid this unnatural sort of teleportation from the old to the new position, we implemented **smooth transitions**.

DAVIDE END CHECKING

An interesting choice for the server we had to debate early on was to go for a dumb server / smart client, or the opposite. The first correspond to how we would develop a solo game, where the client handle the game's logic and the server serves mainly as a place to centralize and broadcast informations. In the case of the smart server / dumb client, it is the server that handles the game logic, and the client's job is to capture inputs from the player and display results from the server. The latter is actually the main way to make multiplayer games as it is much easier to prevent cheats this way. However, we decided not to use it for our case for two reasons :
- We want to make the server run for free and therefore it needs to work on very low ressources.
- Cheating is not a main concern for our game as it is non-competitive and doesn't have a large audience.

That said, we will see later in this readme that there is a part of smart server in our server.

***

## Step 2 : Setting our Goals

Once we had our strong base, it was time to move forward and for that we needed to know more precisely what we wanted to do. A lot of ideas were proposed, such as RPG directions, but we ended up choosing to make a survival multiplayer game. We liked the idea of spawning the player on an archipelago of islands with different biomes where they would be attacked by a variety of monsters. We also wanted to strongly link the game with the theme "To Be Green" by including management and respect of the archipelago's resources.

In the end we did respect the overall direction of our original idea, but could not follow on every aspects of its ambitions. The scope and complexity of our ideas were way too large and complex, so we had to refocus on what was important to our game.

***

## Step 3 : Physics

One choice we made very early in the development was not use the whole BabylonJS's physics engine. We didn't needed its most powerful features as we intended to keep the physic of our game rather simple. Therefore, we chose to create our own physics to have a more lightweight engine.

Gravity's interactions were quite tricky to implement. We assigned to the player variable representing his current acceleration vector. It is then easy at first to implement the gravity or other propulsions such as jumps. However, gravity created difficulties when combined with collisions with the ground. If we always applied gravity the player would glide over even the smoother slope as we wanted something lighter than friction forces. We opted to cast an invisible laser below the player that would detect the ground, and when it does detect ground the gravity is not applied to the player. We can adjut the size of the laser to change the maximum degree of slope the player can climb.

Something else we had fun experimenting with was fall damage. The simplest implementation was to use the previously created acceleration vector and assign fall damage proportional to it. However, this created some frustrating and unintuitive behavior where the player would die after gently gliding in a slope. We managed to assign fairer fall damage by giving to the player variables representing his height position and time when he last touched the ground. If after a fall the difference of height was to high and the difference of time was too low, that would mean the player made a large and hard fall, and they would take fall damage. This implementation created a much more consistent behavior.

***

## Step 4 : Creation of the World

The creation of a stunning map was from the start of the world creation at the heart of our goals. Despite being graphicaly much more limited than more classic downloaded games due to running in a browser, we still wanted to get a "wow" out of the player when they load the game.

All 4 islands were created by ourselves user blender, a 3D modeling logiciel. None of us was experienced with it and it has a quite steep learning tough, so this step took a lot of time. Moreover, we had to endure very long loading times as generating high-quality terrain or textures could takes tens of minutes to hours, so we had to really think about the setting of the parameters before testing.

After a lot of experimentation, we managed to create satisfying terrain models using the ANT (Another Noise Tool) landscape extension on Blender. By tunning the noise's parameters, we can create the different biomes' height map. This tool also allow to texture the terrain, but for the forest terrain the results were not good enough, so for this specific case we made the texture of the terrain by using a shader than asign textures based on rules, in our case the inclination of the terrain.

We created the water out of simple plan to which we gave the very convenient WaterMaterial found in the BabylonJS library with parameters adjusted to our needs. We also implemented a tide that rythm the accessibility of the different islands. When under the water plan, the player enter a swimming state and can drown if they stay for too long. Under the water plan, a sand ground is there, with varying heights to create path between the islands depending on the tide.

We also wanted to have a Day/Night cycle that would make the landscape more varied and would rythm the gameplay. We instantiated animation on the lightning and sky, which contains a lot of parameters in its material to emulate the parameters changing the look of a real sky, to make the cycle as good-looking as we could. While it was quite a long job to animate all the different needed parameters for the different hours of the day, it was well worth it as we feel it was the final touch that finally brought the "wow" we were looking for.

***

## Step 5 : Camera movement

BabylonJS offers some interesting options for cameras, however our specific needs called for addition onto them. For a third person game, a FollowCamera is the best choice, but we had the problem of it going under the ground if the player would turn his back on a slope. Our islands having quite a lot of relief, we had to modify the camera - we added a front and back laser for the camera to know if it is under the ground, and if not how far behind the ground it. This way, the camera get closer to the player when needed to avoid going under the ground, all the while trying to position itself as close to its normal distance to the player at all time. The player also becomes semi-transparent if the camera gets too close, which is a classic technique used in games to avoid the player obstrucating the view when the camera gets too close.

***

## Step 6 : performance issues

All in all, the game is overall not performance-hungry thanks to our work on the physic, as each player only needs to calculate calculate his own movements and not the ones of the other players or monsters, which are transmitted by the server. However, the introduction of the forest made performance much tighter. Because of the high number of trees, the number of frames per seconds dropped really low. To improve on that issue, we implemented an [LoD (Level of Detail)](https://en.wikipedia.org/wiki/Level_of_detail_(computer_graphics)) on trees so we don't have to display high-quality details from afar. We create the trees as instances of the model, for which we freeze the coordinates to lower the computation as much as possible. After working on that, we managed to get back to a good amount of frame per seconds.

Another important part of performance is that we avoid using collision on complex models (player's model, trees...), and instead link objects to a simple hitbox that correspond to the shape of the model, often a cylinder.

It is also interesting to notice that the game physic do not depend on the performance. We use the time between each frame to scale the movements made during physic calculations, so that a player with less frame per seconds will still go at the same speed as others.

***

## Step 7 : the monsters

With our approach on the dumb server / smart client issue, we had difficulties on how to implement the monster's artificial intelligence and movements. Here are the options that were considered :

- One client chosen as the host for the game, which means the monster's caclulations would be made on his side for everyone. Not only this option could create wrong behaviors and large inconveniencies if the host doesn't have a performant enough computer, this would also create difficult to handle cases when the host disconnects.
- Each client spawn a few monsters and handles them. This is a rather elegant solution performance wise, however it introduces a lot of problems on players disconnection as any monster could disappear.
- The server when launched instantiate a special "server-side client", which is a windowless BabylonJS program that contains a minimalist version of the game and is in charge of the monster's intelligence and movements. This is the option we ended up choosing as it is a lot more straightforward to implement and we were more limited in resources on the client-side than on the server-side.

***

## Step 8 : deployement

For the deployment, we chose to use Heroku for the server and Github Pages for the client. We already had experience with both, and those are free resources for us. However, our complex implementation of the server, which needed a rust and a javascript environment, and to be able to launch sub-processes, made the deployment of the server much more complicated than we hoped. We also had problems with the size of the project, as it was too large for most hebergement websites.

To be able to control our server's environment, we therefore used docker to make a container with it. Once dockerised, heberging the container is a lot easier and more controlled than trying to directly heberge our backend code. Using Docker also allowed us to only heberge the file needed.

The process of building the frontend code, building the backend code, creating the docker container, pushing onto our repository, and updating the backend on Heroku was very long and tedious. In order to make our workflow easier and faster, and constantly have an updated version online, we set up a continuous integration pipeline so that a simple push would automaticaly do all the tasks described above. This was a huge quality of life improvement for us and we'll be sure to incorporate it from the start in our future projects.

***

## Step 9 : finalization

With the biggest stepping stone now done, it was time to enter the finalization stage of the game. We had a lot of small bugs to fix and improvements to make so that our game become more of a finalized project and less of a early concept.

First of all we had to use proper character models and animate them. We tried a lot of models but animating them was difficult and time consuming, but after some research we stubbled onto [Mixamo](https://www.mixamo.com/#/), a free website that allows us to download models and attahc animation to them. Using Blender once again, we were able to combine many animations into a models. Once imported, we still had a lot of issues regarding the way to import models, but after working on a refactor we manage to get everything to work as we wanted. All characters now have a variable representing their state, such as "walking", "dying", "swimming of "glinding". The model's animation are declenched according to a state machine using these state and their transitions.

It is also important in a game to have a pleasing soundscape so that it does not feel dull. While we kept things quite calm to not distract the player too much, we added the necessary sounds to make the world feel more alive.

Finally, what is a third person action game without a glider? Pretty much every major release that looks anything alike our game has a glider in it, and for good reasons - it's just that fun ! This is one of the final touches that gave a little extra to the game, and with the work on the scenery, a glider felt like the perfect addition to get a better view while having a funnier way to move around. Moreover, it was a rather easy addition as we just needed to give the player a constant vertical force and prevent the gravity to accelerate them while they glide. We added a rather long laser to check if the player has enough space to glide before allowing them to do so, so go on the tallest cliff you can find and spring your wings !

***

# Perspectives

During the development of this project, we learned a lot about the lower-levels of game development. Indeed, we had to do a lot of work to program the physics ourselves, as well as creating a server from scratch. The deployement was also an interesting and challenging part, and learning how to set up Docker and the continuous integration proved very useful.

Doing a multiplayer game in particular created a lot of particular difficulties, as some things usually manageable such as a simple AI chasing the player could become very complicated in order to get the synchronisation working. That said, overcoming this challenge was well worth the time as being able to play a game with others is a complete different experience in comparison to a solo game, and is espacially convenient in the case of a game you do not even need to download and can play directly in your browser.

We hope that you will enjoy your time on the game as much as we enjoyed developing it !

***

# Launch the Game Localy

While the projct is deployed on heroku and playable simply by clicking on [this link](https://dna-game-production.github.io/GamesOnWeb2023/), it is also possible to launch it localy after having imported the source code. In the project's root, open two terminal and enter the following command:
- <i>cargo run</i> to launch the rust server.
- <i>npm run startc</i> to launch the javascript client.
