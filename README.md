***
# <p  align="center">[Multiplayer 3D Game](https://DNA-Game-Production.github.io/GamesOnWeb2023/) <font size="4">with [*Babylon.js*](https://www.babylonjs.com/)</font><p>
## <p  align="center">by *D.N.A. Production*<p>
***
  
# <p  align="center">[CLICK HERE TO PLAY THE GAME](https://DNA-Game-Production.github.io/GamesOnWeb2023/)</p>
  
***

# Goal 
  The goal of this project was the creation of a 3D Multiplayer Survival game with [<b>Babylon.js</b>](https://www.babylonjs.com/) in Spring of 2023 for the Game on Web 2023 contest. The theme was "To Be Green".
  
***

# How to play the game

First of all, you can launch the game simply by clicking [this link](https://dna-game-production.github.io/GamesOnWeb2023/). You will be asked to enter a name for your character and you're good to go !

Because of humanity's greed and avidity, the planet ran out of resources and society collapsed. Your are a survivor who took refuge on an archipelago, and have nothing but your will and body to defend yourself. Your goal is to survive the hostile environment, and in particular, monsters that will spawn at nights.

This is a multiplayer game, so you might not be the only survivor on the archipelago. Other players live and die by the same rules as you, so choose to cooperate with them in order to become stronger as a group. Or, you could also attack them to make the archipelago your own...

## Controls

- Z : walk forward
- Z + SHIFT : run forward
- S : walk backward
- Q : rotate left
- D : rotate right
- Left Mouse Button : Attack
- SPACE : jump
- SPACE (while falling) : deploy glider
- ENTER : open the in-game chat

***

# The *D.N.A. Production* team

FISSORE Davide | BERNIGAUD Noé 
:-------------------------:|:-------------------------:
<img src="https://zupimages.net/up/23/06/ol5u.png" alt="Fissore Davide" width="200"/> | <img src="https://zupimages.net/up/22/19/dak6.png" alt="BERNIGAUD Noé" width="200"/>

We are two students at the University of Côte d'Azur. Together, we form <b>*D.N.A. Production*</b>.
  
<ul>
  <li>FISSORE Davide was in charge of the menus and UI, the structure of the project, DevOps pipelines, and deployement.</li>
  <li>BERNIGAUD Noe was taking care of the rust server, the islands creation, the models and their animations, the game physics, gameplay, and sounds.</li>
</ul>

However, despite our specialization that occured during the project, we always stayed polyvalent and were able to help each other out whenever someone had a block.

A third student, VENTURELLI Antoine, was originally included in the project and participated in the early versions of the game's logic and physics. Unfortunately, he left the computing science field as well as the project during the first iterations.
  
***

# History, Details and Difficulties of the Development

***

## Step 1 : a basic multiplayer game

When we look at what the game look like now, it might come as a surprise to know how it started : a glorified minichat. We wanted to learn how to program a server, and thought it would be fun to be able to play and test together the game we were developing together. At this stage, we didn't even precisely know what the game would be like, but we wanted to make a server first to better understand how it works and be able to picture how we coud make a multiplayer game.

We also wanted to make the server in the Rust language. None of us knew how to program in Rust, but we were interested in learning and it is a very good option for servers as it is a language with a high control, security, and performance.

Once the minichat was done, we made a rudimental BabylonJS world for players to connect to, and modified the server made for the minichat so that it would also receive, store and broadcast player's position.

![First iteration of the game](https://github.com/DNA-Game-Production/GamesOnWeb2023/assets/56736268/0bfb1e62-22fe-4631-adbc-f004dbad3bab)

Some fun issue we got to experience during our testing was injection attack - we could send special characters, HTML tag, or even code in the minichat to try to crash the server or even make the server interpret it! It was a rather easy fix but something amusing to experiment with nonetheless.

Another issue with the server was the update per second. We couldn't ask the server to update all players positions for all clients 60 times per seconds, as it would generate too many request. But, if we settle for lower than that, the other players move in an irregular way. Therefore, we implemented smooth transitions to make the players transition to his new position instead of teleporting to it.

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

BabylonJS offers some interesting option for cameras, however going with one of the default one wasn't quite enough for our needs. For a third person game, a FollowCamera is the best choice, but we add the problem of it going under the ground if the player would turn his back on a slope. Our islands having quite a lot of relief, we had to modify the camera to fit our needs - we added a front and back laser for the camera to know if it is under the ground, and if not how far behind the ground it. This way, the camera get closer to the player when needed to avoid going under the ground, all the while trying to position itself as close to its normal distance to the player at all time.

***

## Step 6 : performance issues

All in all, the game is overall not performance-hungry thanks to our work on the physic, and the fact each player and calculate his own physic so one client never has a lot of things calculate. However, that changed with the introduction of the forest. Because of the high number of objects, the number of frames per seconds dropped really low. To improve on that issue, we implemented an [LoD (Level of Detail)](https://en.wikipedia.org/wiki/Level_of_detail_(computer_graphics)) on trees so we don't have to display high-quality details from afar. We create the trees as instances of the model, for which we freeze the coordinates to lower the computation as much as possible. After working on that, we managed to get back to a good amount of frame per seconds.

Another important part of performance is that we avoid using collision on complex models (player's model, trees...), and instead link objects to a simple hitbox that correspond to the shape of the model, often a cylinder.

It is also interesting to notice that the game physic do not depend on the performance. We use the time between each frame to scale the movements made during physic calculations, so that a player with less frame per seconds will still go at the same speed as others.

***

## Step 7 : the monsters

With our approach on the dumb server / smart client issue, we had difficulties on how to implement the monster's artificial intelligence and movements. Here are the options that were considered :

- One client chosen as the host for the game, which means the monster's caclulations would be made on his side for everyone. Not only this option could create wrong behaviors and large inconveniencies if the host doesn't have a performant enough computer, this would also create difficult to handle cases when the host disconnects.
- Each client spawn a few monsters and handles them. This is a rather elegant solution performance wise, 
- The server when launched instantiate a special "server-side client", which is a windowless BabylonJS program that contains a minimalist version of the game and is in charge of the monster's intelligence and movements. This is the option we ended up choosing as it is a lot more straightforward to implement and we were more limited in resources on the client-side than on the server-side.

***

## Step 8 : deployement

For the deployment, we chose to use Heroku for the server and Github Pages for the client. We already had experience with both, and those are free resources for us. However, our complex implementation of the server, which needed a rust and a javascript environment, and to be able to launch sub-processes, made the deployment of the server much more complicated than we hoped.

problem of project's size (-> docker)
CD/CI

***

## Step 9 : finalization

animations
visuals
sounds
glider

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

***

Structure
-npm, lancement de l'IA depuis le serveur

Serveur
-comment le serveur marche, quel est son role
-version originel d'un terrain plat, des joueurs qui bougent et un mini-chat

Collisions
-Difficultés avec les déplacement des zombies
-Changement des collisions sur les models vers des collisions par hitbox

Terrain
-problematique serveur (pas de heightmap)
-Blender (shader, ANT landscape...)
-problématiques d'export

Déploiement
-github pages + Heroku, problématique Heroku
