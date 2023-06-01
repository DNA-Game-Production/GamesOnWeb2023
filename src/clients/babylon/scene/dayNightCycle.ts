import { Animation, AnimationGroup, Color3, Vector3 } from "babylonjs";
import { scene } from "../main";
import { hemiLight, light, nightskyMaterial, skyMaterial, water } from "./sceneClient";
import { hour } from "../others/time";
export const ratio = 3.25;
export var animations: AnimationGroup;
export function createDayNightCycle(origin: number): AnimationGroup {

    // ATTENTION AJUSTER RATIO SI TEMPS HEURES SERVEUR MODIFIEE

    //s = Time Interval Server 24h => 24 * 1 sec = 24 sec
    //c = Time Interval Client 24h => 2400/60 sec = 40 sec
    //Ratio = s/c = 0.6
    // var ratio = 0.6

    //skybox
    var animationSkybox = createSkyboxAnimation();
    var animationSkyboxRayleigh = createSkyboxAnimationRayleigh();

    //Light intensity
    var animationLightIntensity = createLightIntensityAnimation();

    //Light tone
    //var animationSky = createSkyAnimation();
    var animationSky = createSkyAnimation();
    var animationLightSpecularColor = createLightColorAnimation("specular");
    var animationLightDiffuseColor = createLightColorAnimation("diffuse");

    //Light shit
    var animationLightShift = createLightShift();

    //night sky alpha
    var animationNightAlpha = createNightSkyAlphaAnimation();

    //HemiLigh intensity
    var animationHemiLight = createHemiLightAnimation();

    //Tide
    var animationTide = createTideAnimation();

    // Create the animation group
    var animationGroup = new AnimationGroup("skyAnimGroup");
    animationGroup.addTargetedAnimation(animationSky, scene);
    animationGroup.addTargetedAnimation(animationSkybox, skyMaterial);
    animationGroup.addTargetedAnimation(animationSkyboxRayleigh, skyMaterial);
    animationGroup.addTargetedAnimation(animationLightIntensity, light);
    animationGroup.addTargetedAnimation(animationLightSpecularColor, light);
    animationGroup.addTargetedAnimation(animationLightDiffuseColor, light);
    animationGroup.addTargetedAnimation(animationLightShift, light);
    animationGroup.addTargetedAnimation(animationNightAlpha, nightskyMaterial);
    animationGroup.addTargetedAnimation(animationHemiLight, hemiLight);
    animationGroup.addTargetedAnimation(animationTide, water);
    animationGroup.normalize(0, 2400 * ratio);

    // Start the animation to the current time
    animationGroup.play();
    animationGroup.goToFrame(origin * 100 * ratio);

    //Launch the looping animation
    animationGroup.play(true);
    animations = animationGroup;

    //Then add the animation object to scene
    //this.animations.push(animationSky);

    //Launch animations on scene, from key 0 to key 2400 with loop activated
    //this.beginAnimation(this, beginning, 2400, true);

    //Keep sync if alt-tab
    function checkTabFocused() {
        if (document.visibilityState === 'visible') syncAnimGroup(hour)
    }
    document.addEventListener('visibilitychange', checkTabFocused);

    return animationGroup;
}

export function syncAnimGroup(time: number) {
    var animHourOffset = (animations.children[0].animation.runtimeAnimations[0].currentFrame / (100 * ratio) - hour)
    if (animHourOffset > 0.5 || animHourOffset < -0.5) {
        console.log("day night adjusted (was unsync of " + animHourOffset + " hour");
        animations.goToFrame(hour * 100 * ratio);
    }
}

function createSkyboxAnimation(): Animation {
    var animationSkybox = new Animation("animationSkybox", "inclination", 60, Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE);

    var keys = [];

    keys.push({ frame: 0, value: -12 / 12 });
    keys.push({ frame: 500 * ratio, value: -7 / 12 });
    keys.push({ frame: 600 * ratio, value: -6 / 12 });
    keys.push({ frame: 800 * ratio, value: -4 / 12 });
    keys.push({ frame: 1200 * ratio, value: 0 / 12 });
    keys.push({ frame: 1700 * ratio, value: 3 / 12 });
    keys.push({ frame: 2000 * ratio, value: 5 / 12 });
    keys.push({ frame: 2200 * ratio, value: 7 / 12 });
    keys.push({ frame: 2300 * ratio, value: 10 / 12 });
    keys.push({ frame: 2400 * ratio, value: 12 / 12 });

    animationSkybox.setKeys(keys);
    return animationSkybox
}

function createSkyboxAnimationRayleigh() {
    var animationSkyboxrayleigh = new Animation("animationRayleigh", "rayleigh", 60, Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE);

    var keys = [];

    keys.push({ frame: 0 * ratio, value: 10 });
    keys.push({ frame: 500 * ratio, value: 10 });
    keys.push({ frame: 650 * ratio, value: 2 });
    keys.push({ frame: 800 * ratio, value: 2 });
    keys.push({ frame: 1700 * ratio, value: 2 });
    keys.push({ frame: 2000 * ratio, value: 10 });
    keys.push({ frame: 2300 * ratio, value: 10 });
    keys.push({ frame: 2400 * ratio, value: 10 });

    animationSkyboxrayleigh.setKeys(keys);
    return animationSkyboxrayleigh
}

function createLightIntensityAnimation() {
    var animationLight = new Animation("animationLightIntensity", "intensity", 60, Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE);

    var keys = [];

    keys.push({ frame: 0, value: 1 });
    keys.push({ frame: 800 * ratio, value: 1 });
    keys.push({ frame: 1000 * ratio, value: 2 });
    keys.push({ frame: 1500 * ratio, value: 2 });
    keys.push({ frame: 1700 * ratio, value: 1.6 });
    keys.push({ frame: 2100 * ratio, value: 1 });
    keys.push({ frame: 2400 * ratio, value: 1 });

    animationLight.setKeys(keys);
    return animationLight
}

function createSkyAnimation(): Animation {
    var animationSky = new Animation("animationSky", "clearColor", 60, Animation.ANIMATIONTYPE_COLOR3,
        Animation.ANIMATIONLOOPMODE_CYCLE);

    var keys = [];

    keys.push({ frame: 0, value: new Color3(0, 0, 0) });
    keys.push({ frame: 550 * ratio, value: new Color3(0, 0, 0) });
    keys.push({ frame: 650 * ratio, value: new Color3(110 / 255, 50 / 255, 20 / 255) });
    keys.push({ frame: 800 * ratio, value: new Color3(135 / 255, 206 / 255, 235 / 255) });
    keys.push({ frame: 1800 * ratio, value: new Color3(135 / 255, 206 / 255, 235 / 255) });
    keys.push({ frame: 2000 * ratio, value: new Color3(110 / 255, 50 / 255, 20 / 255) });
    keys.push({ frame: 2150 * ratio, value: new Color3(0, 0, 0) });
    keys.push({ frame: 2400 * ratio, value: new Color3(0, 0, 0) });

    animationSky.setKeys(keys);
    return animationSky
}

function createLightColorAnimation(lightType: string) {
    var animationLight = new Animation("animationLight" + lightType, lightType, 60, Animation.ANIMATIONTYPE_COLOR3,
        Animation.ANIMATIONLOOPMODE_CYCLE);

    var keys = [];

    keys.push({ frame: 0, value: new Color3(10 / 255, 10 / 255, 30 / 255) });
    keys.push({ frame: 600 * ratio, value: new Color3(10 / 255, 10 / 255, 30 / 255) });
    keys.push({ frame: 700 * ratio, value: new Color3(70 / 255, 30 / 255, 15 / 255) });
    keys.push({ frame: 800 * ratio, value: new Color3(1, 1, 1) });
    keys.push({ frame: 800 * ratio, value: new Color3(1, 1, 1) });
    keys.push({ frame: 1800 * ratio, value: new Color3(1, 1, 1) });
    keys.push({ frame: 2000 * ratio, value: new Color3(70 / 255, 30 / 255, 15 / 255) });
    keys.push({ frame: 2150 * ratio, value: new Color3(10 / 255, 10 / 255, 30 / 255) });
    keys.push({ frame: 2400 * ratio, value: new Color3(10 / 255, 10 / 255, 30 / 255) });

    animationLight.setKeys(keys);
    return animationLight
}

function createLightShift() {
    var animationLight = new Animation("animationLightPosition", "direction", 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

    var keys = [];

    let start = new Vector3(5, -2, -1)
    let end = new Vector3(-5, -2, -1)

    //the sun start --> end
    //the moon start <-- end (more quickly)
    //so light go back to its starting point (without weird teleportation)

    //1/6 = 2400 - 2300 + 500 - 0 = 600 => 100/600
    //end + (start - end) * 1/6
    let startinProgress = end.add(start.subtract(end).scale(1 / 6))

    keys.push({ frame: 0, value: startinProgress });
    keys.push({ frame: 500 * ratio, value: new Vector3(5, -2, -1) });
    keys.push({ frame: 2300 * ratio, value: new Vector3(-5, -2, -1) });
    keys.push({ frame: 2400 * ratio, value: startinProgress });

    animationLight.setKeys(keys);
    return animationLight
}

function createNightSkyAlphaAnimation() {
    var animationHemiLight = new Animation("animationNightAlpha", "alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    var keys = [];

    keys.push({ frame: 0, value: 1 });
    keys.push({ frame: 400 * ratio, value: 1 });
    keys.push({ frame: 600 * ratio, value: 0 });
    keys.push({ frame: 1800 * ratio, value: 0 });
    keys.push({ frame: 2000 * ratio, value: 0 });
    keys.push({ frame: 2400 * ratio, value: 1 });

    animationHemiLight.setKeys(keys);
    return animationHemiLight
}

function createHemiLightAnimation() {
    var animationHemiLight = new Animation("animationHemiLight", "intensity", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    var keys = [];

    keys.push({ frame: 0, value: 0.1 });
    keys.push({ frame: 600 * ratio, value: 0.1 });
    keys.push({ frame: 900 * ratio, value: 0.7 });
    keys.push({ frame: 1800 * ratio, value: 0.7 });
    keys.push({ frame: 2200 * ratio, value: 0.1 });
    keys.push({ frame: 2400 * ratio, value: 0.1 });

    animationHemiLight.setKeys(keys);
    return animationHemiLight
}

function createTideAnimation() {
    var animationTide = new Animation("animationTide", "position.y", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    var keys = [];

    keys.push({ frame: 0, value: -20 });
    keys.push({ frame: 500 * ratio, value: -21 });
    keys.push({ frame: 1100 * ratio, value: -24 });
    keys.push({ frame: 1700 * ratio, value: -24 });
    keys.push({ frame: 2300 * ratio, value: -22 });
    keys.push({ frame: 2400 * ratio, value: -20 });

    animationTide.setKeys(keys);
    return animationTide
}
