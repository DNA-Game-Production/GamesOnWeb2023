import { InstantiatedEntries, Mesh, Scene, Vector3, } from "babylonjs";
import { intrinsicModelPropertiesD } from "./classes/models";
import { createBasicShape, createLabel } from "../others/tools";
import { shadowGenerator } from "../scene/sceneClient";
import { AvatarSoft } from "./avatarSoft";
import { ATTACK_TYPE, CharacterStatus } from "./classes/intrinsicProp";

export abstract class Avatar extends AvatarSoft {
  modelContainer: InstantiatedEntries
  model: Mesh

  private tableAttackDate: Record<ATTACK_TYPE, number>;
  private attackDict: Record<ATTACK_TYPE, (onlyDisplay?: boolean) => void>
  weightCategory: number;
  statusStacks: { burn: number; poison: number; bleed: number; };

  constructor(scene: Scene, avatar_username: string, p: intrinsicModelPropertiesD) {
    // super(scene, avatar_username, p);
    super(scene, avatar_username, createBasicShape(avatar_username, scene, p), p)

    this.modelContainer = p.duplicateModel();
    this.model = this.modelContainer.rootNodes[0] as Mesh

    if (!this.name.includes("plant")) {
      let plane = createLabel(this.name, this, scene, p);
      plane.isPickable = false;
      this.shape.addChild(plane)

      plane.position.y = p?.textYAbove || 1.3

      shadowGenerator?.addShadowCaster(this.model);

    }

    this.shape.addChild(this.model);
    this.shape.isVisible = false;


    //shadowGeneratorCampfire.addShadowCaster(this.model);

    //initialize date of last instance for each attack type
    this.tableAttackDate = { "ATTACK_0": 0, "ATTACK_1": 0, "ATTACK_2": 0, "ATTACK_3": 0 }
    this.attackDict = {
      "ATTACK_0": this.attack_0.bind(this),
      "ATTACK_1": this.attack_1.bind(this),
      "ATTACK_2": this.attack_2.bind(this),
      "ATTACK_3": this.attack_3.bind(this)
    }

    this.weightCategory = p.weight

    this.statusStacks = { burn: 0, poison: 0, bleed: 0 }

    for (let aniCounter = 0; aniCounter < this.modelContainer.animationGroups.length; aniCounter++) {
      //console.log("set up animation transition for groupe " + aniCounter + " (" + this.modelContainer.animationGroups[aniCounter].name);

      for (let index = 0; index < this.modelContainer.animationGroups[aniCounter].targetedAnimations.length; index++) {
        let animation = this.modelContainer.animationGroups[aniCounter].targetedAnimations[index].animation
        animation.enableBlending = true
        animation.blendingSpeed = 0.08
      }
    }
  }

  dispose(): void {
    super.dispose()
  }

  hit(hitModeId: ATTACK_TYPE, onlyDisplay = false) {
    if (!this.attackIsReady(hitModeId)) return false
    this.attackDict[hitModeId](onlyDisplay)
    return true
  }

  attackIsReady(id: ATTACK_TYPE) {
    if (this.canHit && !this.isInAir() && this.getStatus() !== "Swimming" && (!this.tableAttackDate[id] || this.tableAttackDate[id] + this.intrinsicModelProperties.attackSpeed[id] < Date.now())) {
      this.tableAttackDate[id] = Date.now()
      return true
    }
    return false
  }

  attack_0(onlyDisplay = false) {
    console.log("ERROR: tried to call non-implemented attack_0 on avatar ", this);
  }
  attack_1(onlyDisplay = false) {
    console.log("ERROR: tried to call non-implemented attack_1 on avatar ", this);
  }
  attack_2(onlyDisplay = false) {
    console.log("ERROR: tried to call non-implemented attack_2 on avatar ", this);
  }
  attack_3(onlyDisplay = false) {
    console.log("ERROR: tried to call non-implemented attack_3 on avatar ", this);
  }

  abstract take_damage(source: Vector3, amount: number, knockback_power: number): void

  triggerStatus(statut: string) {
    switch (statut) {

      //burn, large damage over short period, does not cumulate
      case "burn":
        if (this.statusStacks.burn >= 1) return
        this.statusStacks.burn++
        var burningDamage = setInterval(() => {
          if (this) this.take_damage(this.shape.position, 10, 0)
        }, 500)
        setTimeout(() => {
          this.statusStacks.burn--
          clearInterval(burningDamage)
        }, 2000)
        break;

      //poison, small damage over long period, does cumulate
      case "poisoned":
        this.statusStacks.poison++
        var poisoningDamage = setInterval(() => {
          if (this) this.take_damage(this.shape.position, 5, 0)
        }, 500)
        setTimeout(() => {
          this.statusStacks.poison--
          clearInterval(poisoningDamage)
        }, 10000)
        break;

      //bleed, large damage over long period, does not cumulate
      case "bleed":
        if (this.statusStacks.bleed >= 1) {
          //console.log("bleed already applied");
          return
        }
        this.statusStacks.bleed++
        //console.log("applying bleed, stack now ", this.statusStacks.bleed);
        var bleedingDamage = setInterval(() => {
          if (this) this.take_damage(this.shape.position, 5, 0)
        }, 200)
        setTimeout(() => {
          this.statusStacks.bleed--
          clearInterval(bleedingDamage)
        }, 6000)
        break;

      default:
      //console.log(statut, " effect does not exist");
    }
  }

  update_status(new_status: CharacterStatus, loopAnim = true, force = false) {
    if (!force && (this.status === "Dying" || this.status === "Swimming")) return
    if (new_status === this.status) return
    if (new_status === "Dying") loopAnim = false
    var animation_indice = this.get_status_indice(this.status)
    if (animation_indice !== -1) {
      this.modelContainer.animationGroups[animation_indice].stop()
    }
    animation_indice = this.get_status_indice(new_status)
    if (animation_indice !== -1) {
      this.modelContainer.animationGroups[animation_indice].reset()
      this.modelContainer.animationGroups[animation_indice].play()
      this.modelContainer.animationGroups[animation_indice].loopAnimation = loopAnim
    }
    super.update_status(new_status)
  }

}