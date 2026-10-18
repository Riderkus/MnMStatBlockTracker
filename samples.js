/* =============================================================================
 * Sample lists for the "From the book" buttons: skills, advantages, powers
 * (every power effect plus the sample powers) and complications, summarised
 * from the Mutants & Masterminds Deluxe Hero's Handbook. DATA ONLY: app.js
 * reads window.SAMPLES. Generated from the book text; edit freely.
 *
 * Shapes:
 *   skills:        { name, ability, trained, text }
 *   advantages:    { name, type, ranked, max, effect, text }
 *   powers:        { name, kind: 'effect'|'sample', type?, action?, range?,
 *                    duration?, resist?, effect?, cost, perRank, flat, text }
 *                  perRank / flat are the cost as numbers when the book gives
 *                  a plain figure, otherwise null (cost keeps the wording).
 *   complications: { name, group: 'Motivation'|'Complication', text }
 * ========================================================================== */
window.SAMPLES = {
  "skills": [
    {
      "name": "Acrobatics",
      "ability": "AGL",
      "trained": true,
      "text": "Flips, dives, rolls, tumbling and keeping your balance."
    },
    {
      "name": "Athletics",
      "ability": "STR",
      "trained": false,
      "text": "Climbing, jumping, running, swimming and riding."
    },
    {
      "name": "Close Combat",
      "ability": "FGT",
      "trained": false,
      "text": "Bonus to attack checks with one specific close attack; name the attack (e.g. Close Combat: Swords)."
    },
    {
      "name": "Deception",
      "ability": "PRE",
      "trained": false,
      "text": "Bluffing, disguise, feinting, innuendo and trickery. Interaction skill."
    },
    {
      "name": "Expertise",
      "ability": "INT",
      "trained": true,
      "text": "Knowledge of one field; name it (e.g. Expertise: Science). Some fields use another ability."
    },
    {
      "name": "Insight",
      "ability": "AWE",
      "trained": false,
      "text": "Reading intentions, resisting manipulation, spotting illusions and influence."
    },
    {
      "name": "Intimidation",
      "ability": "PRE",
      "trained": false,
      "text": "Coercing and demoralizing. Interaction skill."
    },
    {
      "name": "Investigation",
      "ability": "INT",
      "trained": true,
      "text": "Searching, gathering and analyzing evidence, gathering information, surveillance."
    },
    {
      "name": "Perception",
      "ability": "AWE",
      "trained": false,
      "text": "Noticing things with any sense."
    },
    {
      "name": "Persuasion",
      "ability": "PRE",
      "trained": false,
      "text": "Negotiating and improving attitudes. Interaction skill."
    },
    {
      "name": "Ranged Combat",
      "ability": "DEX",
      "trained": false,
      "text": "Bonus to attack checks with one specific ranged attack; name the attack (e.g. Ranged Combat: Guns)."
    },
    {
      "name": "Sleight of Hand",
      "ability": "DEX",
      "trained": true,
      "text": "Palming, picking pockets, escaping restraints, legerdemain. Manipulation skill."
    },
    {
      "name": "Stealth",
      "ability": "AGL",
      "trained": false,
      "text": "Hiding, sneaking and tailing."
    },
    {
      "name": "Technology",
      "ability": "INT",
      "trained": true,
      "text": "Operating, building, repairing and defeating devices and security. Manipulation skill, requires tools."
    },
    {
      "name": "Treatment",
      "ability": "INT",
      "trained": true,
      "text": "Diagnosing, reviving, stabilizing and treating injuries, disease and poison. Manipulation skill, requires tools."
    },
    {
      "name": "Vehicles",
      "ability": "DEX",
      "trained": true,
      "text": "Operating vehicles under pressure. Manipulation skill."
    }
  ],
  "advantages": [
    {
      "name": "Accurate Attack",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Trade effect DC for attack bonus.",
      "text": "When you make an accurate attack (see Maneuvers, page 249) you can take a penalty of up to ­5 on the effect modifier of the attack and add the same number (up to +5) to your attack bonus."
    },
    {
      "name": "Agile Feint",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Feint using Acrobatics skill or movement speed.",
      "text": "You can use your Acrobatics bonus or movement speed rank in place of Deception to feint and trick in combat as if your skill bonus or speed rank were your Deception bonus (see the Deception skill description). Your opponent opposes the attempt with Acrobatics or Insight (whichever is better)."
    },
    {
      "name": "All-out Attack",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Trade active defense for attack bonus.",
      "text": "When you make an all-out attack (see Maneuvers, page 249) you can take a penalty of up to ­5 on your active defenses (Dodge and Parry) and add the same number (up to +5) to your attack bonus."
    },
    {
      "name": "Animal Empathy",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Use interaction skills normally with animals.",
      "text": "You have a special connection with animals. You can use interaction skills on animals normally, and do not have to speak a language the animal understands; you communicate your intent through gestures and body language and learn things by studying animal behavior."
    },
    {
      "name": "Artificer",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Use Expertise: Magic to create temporary magical devices.",
      "text": "You can use the Expertise: Magic skill to create temporary magical devices. See Magical Inventions, page 212, for details."
    },
    {
      "name": "Assessment",
      "type": "General",
      "ranked": false,
      "max": null,
      "effect": "Use Insight to learn an opponent's combat capabilities.",
      "text": "You're able to quickly size up an opponent's combat capabilities. Choose a target you can accurately perceive and have the GM make a secret Insight check for you as a free action, opposed by the target's Deception check result."
    },
    {
      "name": "Attractive",
      "type": "Skill",
      "ranked": true,
      "max": "2",
      "effect": "Circumstance bonus to interaction based on your looks.",
      "text": "You're particularly attractive, giving you a +2 circumstance bonus on Deception and Persuasion checks to deceive, seduce, or change the attitude of anyone who finds your looks appealing. With a second rank, you are Very Attractive, giving you a +5 circumstance bonus.This bonus does not count as part of your regular…"
    },
    {
      "name": "Beginner's Luck",
      "type": "Fortune",
      "ranked": false,
      "max": null,
      "effect": "Spend a hero point to gain 5 temporary ranks in a skill.",
      "text": "By spending a hero point, you gain an effective 5 ranks in one skill of your choice you currently have at 4 or fewer ranks, including skills you have no ranks in, even if they can't be used untrained. These temporary skill ranks last for the duration of the scene and grant you their normal benefits."
    },
    {
      "name": "Benefit",
      "type": "General",
      "ranked": true,
      "max": null,
      "effect": "Gain a significant perquisite or fringe benefit.",
      "text": "You have some significant perquisite or fringe benefit.The exact nature of the benefit is for you and the Gamemaster to determine. As a rule of thumb it should not exceed the benefits of any other advantage, or a power effect costing 1 point (see Feature in the Powers chapter)."
    },
    {
      "name": "Chokehold",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Suffocate an opponent you have successfully grabbed.",
      "text": "If you successfully grab and restrain an opponent (see Grab, page 248), you can apply a chokehold, causing your opponent to begin suffocating for as long as you continue to restrain your target (see Suffocation, page 238)."
    },
    {
      "name": "Close Attack",
      "type": "Combat",
      "ranked": true,
      "max": null,
      "effect": "+1 bonus to close attack checks per rank.",
      "text": "You have a +1 bonus to close attacks checks per rank in this advantage. Your total attack bonus is still limited by power level."
    },
    {
      "name": "Connected",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Call in assistance or favors with a Persuasion check.",
      "text": "You know people who can help you out from time to time. It might be advice, information, help with a legal matter, or access to resources."
    },
    {
      "name": "Contacts",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Make an initial Investigation check in one minute.",
      "text": "You have such extensive and well-informed contacts you can make an Investigation check to gather information in only one minute, assuming you have some means of getting in touch with your contacts. Further Investigation checks to gather information on the same subject require the normal length of time, since you must…"
    },
    {
      "name": "Daze",
      "type": "Skill",
      "ranked": true,
      "max": "2",
      "effect": "Use Deception or Intimidation to daze an opponent.",
      "text": "You can make a Deception or Intimidation check as a standard action (choose which skill when you acquire the advantage) to cause an opponent to hesitate in combat. Make a skill check as a standard action against your target's resistance check (the same skill, Insight, or Will defense, whichever has the highest bonus)."
    },
    {
      "name": "Defensive Attack",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Trade attack bonus for active defense bonus.",
      "text": "When you make a defensive attack (see Maneuvers, page 249), you can take a penalty of up to ­5 on your attack bonus and add the same number (up to +5) to both your active defenses (Dodge and Parry)."
    },
    {
      "name": "Defensive Roll",
      "type": "Combat",
      "ranked": true,
      "max": null,
      "effect": "+1 active defense bonus to Toughness per rank.",
      "text": "You can avoid damage through agility and \"rolling\" with an attack. You receive a bonus to your Toughness equal to your advantage rank, but it is considered an active defense similar to Dodge and Parry (see Active Defenses in the Abilities chapter), so you lose this bonus whenever you are vulnerable or defenseless."
    },
    {
      "name": "Diehard",
      "type": "General",
      "ranked": false,
      "max": null,
      "effect": "Automatically stabilize when dying.",
      "text": "When your condition becomes dying (see Conditions in the Action & Adventure chapter) you automatically stabilize on the following round without any need for a Fortitude check, although further damage--such as a finishing attack--can still kill you."
    },
    {
      "name": "Eidetic Memory",
      "type": "General",
      "ranked": false,
      "max": null,
      "effect": "Total recall, +5 circumstance bonus to remember things.",
      "text": "You have perfect recall of everything you've experienced. You have a +5 circumstance bonus on checks to remember things, including resistance checks against effects that alter or erase memories."
    },
    {
      "name": "Equipment",
      "type": "General",
      "ranked": true,
      "max": null,
      "effect": "5 points of equipment per rank.",
      "text": "You have 5 points per rank in this advantage to spend on equipment. This includes vehicles and headquarters."
    },
    {
      "name": "Evasion",
      "type": "Combat",
      "ranked": true,
      "max": "2",
      "effect": "Circumstance bonus to avoid area effects.",
      "text": "You have a +2 circumstance bonus to Dodge resistance checks to avoid area effects (see the Area extra in the Powers chapter). If you have 2 ranks in this advantage, your circumstance bonus increases to +5."
    },
    {
      "name": "Extraordinary Effort",
      "type": "General",
      "ranked": false,
      "max": null,
      "effect": "Gain two benefits when using extra effort.",
      "text": "When using extra effort (see Extra Effort in The Basics chapter), you can gain two of the listed benefits, even stacking two of the same type of benefit. However, you also double the cost of the effort; you're exhausted starting the turn after your extraordinary effort."
    },
    {
      "name": "Fascinate",
      "type": "Skill",
      "ranked": true,
      "max": null,
      "effect": "Use an interaction skill to entrance others.",
      "text": "One of your interaction skills is so effective you can capture and hold other's attention with it. Choose Deception, Intimidation, or Persuasion when you acquire this advantage."
    },
    {
      "name": "Fast Grab",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Make a free grab check after an unarmed attack.",
      "text": "When you hit with an unarmed attack you can immediately make a grab check against that opponent as a free action (see Grab, page 248). Your unarmed attack inflicts its normal damage and counts as the initial attack check required to grab your opponent."
    },
    {
      "name": "Favored Environment",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Circumstance bonus to attack or defense in an environment.",
      "text": "You have an environment you're especially suited for fighting in. Examples include in the air, underwater, in space, in extreme heat or cold, in jungles or woodlands, and so forth."
    },
    {
      "name": "Favored Foe",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Circumstance bonus to checks against a type of opponent.",
      "text": "You have a particular type of opponent you've studied or are especially effective against. It may be a type of creature (aliens, animals, constructs, mutants, undead, etc.), a profession (soldiers, police officers, Yakuza, etc.) or any other category the GM approves."
    },
    {
      "name": "Fearless",
      "type": "General",
      "ranked": false,
      "max": null,
      "effect": "Immune to fear effects.",
      "text": "You are immune to fear effects of all sorts, essentially the same as an Immunity to Fear effect (see Immunity in the Powers chapter)."
    },
    {
      "name": "Grabbing Finesse",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Substitute Dex for Str when making grab attacks.",
      "text": "You can use your Dexterity bonus, rather than your Strength bonus, to make grab attacks. You are not vulnerable while grabbing."
    },
    {
      "name": "Great Endurance",
      "type": "General",
      "ranked": false,
      "max": null,
      "effect": "+5 on checks involving endurance.",
      "text": "You have a +5 bonus on checks to avoid becoming fatigued and checks to hold your breath, avoid damage from starvation or thirst, avoid damage from hot or cold environments, and to resist suffocation and drowning. See Hazards and the Environment in the Action & Adventure chapter for details on these checks."
    },
    {
      "name": "Hide in Plain Sight",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Hide while observed without need for a diversion.",
      "text": "You can hide (see Hiding under Stealth in the Skills chapter) without any need for a Deception or Intimidation check or any sort of diversion, and without penalty to your Stealth check. You're literally there one moment, and gone the next."
    },
    {
      "name": "Improved Aim",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Double circumstance bonuses for aiming.",
      "text": "You have an even keener eye when it comes to ranged combat. When you take a standard action to aim, you gain double the normal circumstance bonus: +10 for a close attack or ranged attack adjacent to the target, +5 for a ranged attack at a greater distance."
    },
    {
      "name": "Improved Critical",
      "type": "Combat",
      "ranked": true,
      "max": null,
      "effect": "+1 to critical threat range with an attack per rank.",
      "text": "Increase your critical threat range with a particular attack (chosen when you acquire this advantage) by 1, allowing you to score a critical hit on a natural 19 or 20. Only a natural 20 is an automatic hit, however, and an attack that misses is not a critical."
    },
    {
      "name": "Improved Defense",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "+2 bonus to active defense when you take the defend action.",
      "text": "When you take the defend action in combat (see Defend in the Action & Adventure chapter) you gain a +2 circumstance bonus to your active defense checks for the round."
    },
    {
      "name": "Improved Disarm",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "No penalty for the disarm action.",
      "text": "You have no penalty to your attack check when attempting to disarm an opponent and they do not get the opportunity to disarm you (see Disarm in the Action & Adventure chapter)."
    },
    {
      "name": "Improved Grab",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Make grab attacks with one arm. Not vulnerable while grabbing.",
      "text": "You can make grab attacks with only one arm, leaving the other free. You can also maintain the grab while using your other hand to perform actions."
    },
    {
      "name": "Improved Hold",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "­5 circumstance penalty to escape from your holds.",
      "text": "Your grab attacks are particularly difficult to escape. Opponents you grab suffer a ­5 circumstance penalty on checks to escape."
    },
    {
      "name": "Improved Initiative",
      "type": "Combat",
      "ranked": true,
      "max": null,
      "effect": "+4 bonus to initiative checks per rank.",
      "text": "You have a +4 bonus to your initiative checks per rank in this advantage."
    },
    {
      "name": "Improved Smash",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "No penalty for the smash action.",
      "text": "You have no penalty to attack checks to hit an object held by another character (see Smash in the Action & Adventure chapter)."
    },
    {
      "name": "Improved Trip",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "No penalty for the trip action.",
      "text": "You have no penalty to your attack check to trip an opponent and they do not get the opportunity to trip you. When making a trip attack, make an opposed check of your Acrobatics or Athletics against your opponent's Acrobatics or Athletics, you choose which your opponent uses to defend, rather than the target choosing…"
    },
    {
      "name": "Improvised Tools",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "No penalty for using skills without tools.",
      "text": "You ignore the circumstance penalty for using skills without proper tools, since you can improvise sufficient tools with whatever is at hand. If you're forced to work without tools at all, you suffer only a ­2 penalty."
    },
    {
      "name": "Improvised Weapon",
      "type": "Combat",
      "ranked": true,
      "max": null,
      "effect": "Use Unarmed Combat skill with improvised weapons, +1 damage bonus.",
      "text": "When wielding an improvised close combat weapon-anything from a chair to a telephone pole or entire car-you use your Close Combat: Unarmed skill bonus for attack checks with the\"weapon\"rather than relying on your general Close Combat skill bonus. Additional ranks in this advantage give you a +1 bonus to Damage with…"
    },
    {
      "name": "Inspire",
      "type": "Fortune",
      "ranked": true,
      "max": "5",
      "effect": "Spend a hero point to grant allies a +1 circumstance bonus per rank.",
      "text": "You can inspire your allies to greatness. Once per scene, by taking a standard action and spending a hero point, allies able to interact with you gain a +1 circumstance bonus per Inspire rank on all checks until the start of your next round, with a maximum bonus of +5."
    },
    {
      "name": "Instant Up",
      "type": "General",
      "ranked": false,
      "max": null,
      "effect": "Stand from prone as a free action.",
      "text": "You can go from prone to standing as a free action without the need for an Acrobatics skill check."
    },
    {
      "name": "Interpose",
      "type": "General",
      "ranked": false,
      "max": null,
      "effect": "Take an attack meant for an ally.",
      "text": "Once per round, when an ally within range of your normal movement is hit by an attack, you can choose to place yourself between the attacker and your ally as a reaction, making you the target of the attack instead. The attack hits you rather than your ally, and you suffer the effects normally."
    },
    {
      "name": "Inventor",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Use Technology to create temporary devices.",
      "text": "You can use the Technology skill to create inventions. See Inventing, page 211, for details."
    },
    {
      "name": "Jack-of-all-trades",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Use any skill untrained.",
      "text": "You can use any skill untrained, even skills or aspects of skills that normally cannot be used untrained, although you must still have proper tools if the skill requires them."
    },
    {
      "name": "Languages",
      "type": "Skill",
      "ranked": true,
      "max": null,
      "effect": "Speak and understand additional languages.",
      "text": "You can speak and understand additional languages. With one rank in this advantage, you know an additional language."
    },
    {
      "name": "Leadership",
      "type": "Fortune",
      "ranked": false,
      "max": null,
      "effect": "Spend a hero point to remove a condition from an ally.",
      "text": "Your presence reassures and lends courage to your allies. As a standard action, you can spend a hero point to relevel limits, like other uses of hero points."
    },
    {
      "name": "Luck",
      "type": "Fortune",
      "ranked": true,
      "max": "1/2 PL",
      "effect": "Re-roll a die roll once per rank.",
      "text": "Once per round, you can choose to re-roll a die roll, like spending a hero point (see Hero Points, page 20), including adding 10 to re-rolls of 10 or less. You can do this a number of times per game session equal to your Luck rank, with a maximum rank of half the series power level (rounded down)."
    },
    {
      "name": "Minion",
      "type": "General",
      "ranked": true,
      "max": null,
      "effect": "Gain a follower or minion with (15 x rank) power points.",
      "text": "You have a follower or minion. This minion is an independent character with a power point total of (advantage rank x 15)."
    },
    {
      "name": "Move-by Action",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Move both before and after your standard action.",
      "text": "When taking a standard action and a move action you can move both before and after your standard action, provided the total distance moved isn't greater than your normal movement speed."
    },
    {
      "name": "Power Attack",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Trade attack bonus for effect bonus.",
      "text": "When you make a power attack (see Maneuvers, page 250) you can take a penalty of up to ­5 on your attack bonus and add the same number (up to +5) to the effect bonus of your attack."
    },
    {
      "name": "Precise Attack",
      "type": "Combat",
      "ranked": true,
      "max": "4",
      "effect": "Ignore attack check penalties for either cover or concealment.",
      "text": "When you make close or ranged attacks (choose one) you ignore attack check penalties for cover or concealment (choose one), although total cover still prevents you from making attacks. Each additional rank in this advantage lets you choose an additional option, so with Precise Attack 4, all your attacks (both close…"
    },
    {
      "name": "Prone Fighting",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "No penalties for fighting while prone.",
      "text": "You suffer no circumstance penalty to attack checks for being prone, and adjacent opponents do not gain the usual circumstance bonus for close attacks against you."
    },
    {
      "name": "Quick Draw",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Draw a weapon as a free action.",
      "text": "You can draw a weapon from a holster or sheath as a free action, rather than a move action."
    },
    {
      "name": "Ranged Attack",
      "type": "Combat",
      "ranked": true,
      "max": null,
      "effect": "+1 bonus to ranged attack checks per rank.",
      "text": "You have a +1 bonus to ranged attacks checks per rank in this advantage. Your total attack bonus is still limited by power level."
    },
    {
      "name": "Redirect",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Use Deception to redirect a missed attack at another target.",
      "text": "If you successfully trick an opponent (see Trick under Deception in the Skills chapter), you can redirect a missed attack against you from that opponent at another target as a reaction. The new target must be adjacent to you and within range of the attack."
    },
    {
      "name": "Ritualist",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Use Expertise: Magic to create and perform rituals.",
      "text": "You can use the Expertise: Magic skill to create and cast magical rituals (see page 212). This advantage is often a back-up or secondary magical power for superhuman sorcerers, and may be the only form of magic available to some\"dabbler\"types."
    },
    {
      "name": "Second Chance",
      "type": "General",
      "ranked": true,
      "max": null,
      "effect": "Re-roll a failed check against a hazard once.",
      "text": "Choose a particular hazard, such as falling, being tripped, triggering traps, mind control (or another fairly specific power effect, such as Damage with the fire descriptor) or a particular skill with consequences for failure. If you fail a check against that hazard, you can make another immediately and use the better…"
    },
    {
      "name": "Seize Initiative",
      "type": "Fortune",
      "ranked": false,
      "max": null,
      "effect": "Spend a hero point to go first in the initiative order.",
      "text": "You can spend a hero point to automatically go first in the initiative order. You may only do so at the start of combat, when you would normally make your initiative check."
    },
    {
      "name": "Set-up",
      "type": "Combat",
      "ranked": true,
      "max": null,
      "effect": "Transfer the benefit of an interaction skill to an ally.",
      "text": "You can transfer the benefits of a successful combat use of an interaction skill to your teammate(s). For example, you can feint and have your target vulnerable against one or more allies next attack(s), rather than yours."
    },
    {
      "name": "Sidekick",
      "type": "General",
      "ranked": true,
      "max": null,
      "effect": "Gain a sidekick with (5 x rank) power points.",
      "text": "You have another character serving as your partner and aide. Create your sidekick as an independent character with (advantage rank x 5) power points, and subject to the series power level."
    },
    {
      "name": "Skill Mastery",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Make routine checks with one skill under any conditions.",
      "text": "Choose a skill. You can make routine checks with that skill even when under pressure (see Routine Checks in The Basics chapter)."
    },
    {
      "name": "Startle",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Use Intimidation to feint in combat.",
      "text": "You can use Intimidation rather than Deception to feint in combat (see Feint under the Deception skill description). Targets resist with Insight, Intimidation, or Will defense."
    },
    {
      "name": "Takedown",
      "type": "Combat",
      "ranked": true,
      "max": "2",
      "effect": "Free extra attack when you incapacitate a minion.",
      "text": "If you render a minion incapacitated with an attack, you get an immediate extra attack as a free action against another minion within range and adjacent to the previous target's location. The extra attack is with the same attack and bonus as the first."
    },
    {
      "name": "Taunt",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Use Deception to demoralize in combat.",
      "text": "You can demoralize an opponent with Deception rather than Intimidation (see Demoralize under the Intimidation skill description), disparaging and undermining confidence rather than threatening. Targets resist using Deception, Insight, or Will defense."
    },
    {
      "name": "Teamwork",
      "type": "General",
      "ranked": false,
      "max": null,
      "effect": "+5 bonus to support team checks.",
      "text": "You're effective at helping out your friends. When you support a team check (see Team Checks in The Basics chapter) you have a +5 circumstance bonus to your check."
    },
    {
      "name": "Throwing Mastery",
      "type": "Combat",
      "ranked": true,
      "max": null,
      "effect": "+1 damage bonus with thrown weapons per rank.",
      "text": "You have a +1 damage bonus with thrown weapons per rank in this advantage.You can also throw normally harmless objects--playing cards, pens, paper clips, and so forth--as weapons with a damage bonus equal to your advantage rank and range based on the higher of your advantage rank or Strength (see Ranged in the Powers…"
    },
    {
      "name": "Tracking",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Use Perception to follow tracks.",
      "text": "You can use the Perception skill to visually follow tracks like the Tracking Senses effect (see the Powers chapter)."
    },
    {
      "name": "Trance",
      "type": "General",
      "ranked": false,
      "max": null,
      "effect": "Go into a deathlike trance that slows bodily functions.",
      "text": "Through breathing and bodily control, you can slip into a deep trance. This takes a minute of uninterrupted meditation and a DC 15 Awareness check."
    },
    {
      "name": "Ultimate Effort",
      "type": "Fortune",
      "ranked": false,
      "max": null,
      "effect": "Spend a hero point to get an effective 20 on a specific check.",
      "text": "You can spend a hero point on a particular check and treat the roll as a 20 (meaning you don't need to roll the die at all, just apply a result of 20 to your modifier). This is not a natural 20, but is treated as a roll of 20 in all other respects."
    },
    {
      "name": "Uncanny Dodge",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Not vulnerable when surprised or caught off-guard.",
      "text": "You are especially attuned to danger. You are not vulnerable when surprised or otherwise caught off-guard.You are still made vulnerable by effects that limit your mobility."
    },
    {
      "name": "Weapon Bind",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Free disarm attempt when you actively defend.",
      "text": "If you take the defend action (see Defend in the Action & Adventure chapter) and successfully defend against a close weapon attack, you can make a disarm attempt against the attacker immediately as a reaction.The disarm attempt is carried out normally, including the attacker getting the opportunity to disarm you."
    },
    {
      "name": "Weapon Break",
      "type": "Combat",
      "ranked": false,
      "max": null,
      "effect": "Free smash attack when you actively defend.",
      "text": "If you take the defend action (see Defend in the Action & Adventure chapter) and successfully defend against a close weapon attack, you can make an attack against the attacker's weapon immediately as a reaction. This requires an attack check and inflicts normal damage to the weapon if it hits (see Smash in the Action…"
    },
    {
      "name": "Well-informed",
      "type": "Skill",
      "ranked": false,
      "max": null,
      "effect": "Immediate Investigation or Persuasion check to know something.",
      "text": "You are exceptionally well-informed. When encountering an individual, group, or organization for the first time, you can make an immediate Investigation or Persuasion skill check to see if your character has heard something about the subject."
    }
  ],
  "powers": [
    {
      "name": "Affliction",
      "kind": "effect",
      "type": "Attack",
      "action": "Standard",
      "range": "Close",
      "duration": "Instant",
      "resist": "Fort.",
      "cost": "or Will 1 per rank",
      "text": "You can impose some debilitating condition or conditions on a target by making a close attack. You set the conditions your Affliction causes at each degree when you acquire it and they may not be changed.",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Alternate Form",
      "kind": "sample",
      "effect": "Varies, Activation",
      "cost": "effects total ­1 or 2 points",
      "text": "You can transform into something other than mere flesh and blood, from a body of organic steel to a cloud of gas, a mass of liquid, a swarm of tiny insect-sized robots, or anything else you want to develop. Choose a set of effects that reflect the capabilities of your Alternate Form, based on the examples following.",
      "perRank": null,
      "flat": null
    },
    {
      "name": "Blast",
      "kind": "sample",
      "type": "Attack",
      "action": "Standard",
      "range": "Ranged",
      "duration": "Instant",
      "resist": "Toughness",
      "cost": "2 per rank",
      "text": "You can make a damaging ranged attack. It might be a blast of energy, a projectile (arrow, bullet, throwing blade, etc.), or some similar effect.",
      "effect": "Ranged Damage",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Burrowing",
      "kind": "effect",
      "type": "Movement",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "1 per rank",
      "text": "You can burrow through the ground, leaving a tunnel behind if you choose. You move through soil and sand at a speed rank equal to your Burrowing rank, minus 5.",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Communication",
      "kind": "effect",
      "type": "Sensory",
      "action": "Free",
      "range": "Rank",
      "duration": "Sustained",
      "resist": null,
      "cost": "4 per rank",
      "text": "You can communicate over a distance using a medium other than your normal voice. Choose a sense type as your Communication medium (see the list of examples).",
      "perRank": 4,
      "flat": null
    },
    {
      "name": "Comprehend",
      "kind": "effect",
      "type": "Sensory",
      "action": "None",
      "range": "Personal",
      "duration": "Permanent",
      "resist": null,
      "cost": "2 per rank",
      "text": "You can comprehend different sorts of communication. Each rank in this effect allows you to choose one of the following options:",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Concealment",
      "kind": "effect",
      "type": "Sensory",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "2 per rank",
      "text": "You gain total concealment from a particular sense while this effect is active, although you are still detectable to other senses (even other senses of the same sense type; so you could have full concealment against normal sight, but not infravision or any other sense in the sight sense type). Each additional rank…",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Create",
      "kind": "effect",
      "type": "Control",
      "action": "Standard",
      "range": "Ranged",
      "duration": "Sustained",
      "resist": null,
      "cost": "2 per rank",
      "text": "You can form solid objects essentially out of nowhere. They may be made of solidified energy, \"hardened\" water or air, transmuted bulk matter, ice, stone, or some other medium, depending on the effect's descriptors.",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Damage",
      "kind": "effect",
      "type": "Attack",
      "action": "Standard",
      "range": "Close",
      "duration": "Instant",
      "resist": "Toughness",
      "cost": "1 per rank",
      "text": "You can inflict damage on a target by making a close attack. The exact nature of your Damage is up to you, with the GM's approval; it can be anything from a powerful impact to razor claws, energy fields, or some other damaging medium.",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Dazzle",
      "kind": "sample",
      "type": "Attack",
      "action": "Standard",
      "range": "Ranged",
      "duration": "Instant",
      "resist": "Fort.",
      "cost": "or Will 2 per rank",
      "text": "You can overwhelm one of the target's senses, chosen when you take this effect. The target makes a Fortitude or Will resistance check against your effect DC (choose one when you acquire the effect).",
      "effect": "Ranged, Cumulative Affliction, Limited to One Sense",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Deflect",
      "kind": "effect",
      "type": "Defense",
      "action": "Standard",
      "range": "Ranged",
      "duration": "Instant",
      "resist": null,
      "cost": "1 per rank",
      "text": "You can actively defend for characters other than yourself, deflecting or diverting attacks against them at a distance, and may be able to more effectively defend yourself, depending on your rank. See the Defend action in the Action & Adventure chapter for details.",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Duplication",
      "kind": "sample",
      "type": "Control",
      "action": "Standard",
      "range": "Close",
      "duration": "Sustained",
      "resist": null,
      "cost": "3 per rank",
      "text": "You can create a duplicate of yourself. Your duplicate is a minion with the same traits as you, except for this power and any hero points.",
      "effect": "Summon Duplicate, Active",
      "perRank": 3,
      "flat": null
    },
    {
      "name": "Element Control",
      "kind": "sample",
      "type": "Control",
      "action": "Standard",
      "range": "Perception",
      "duration": "Sustained",
      "resist": "Strength",
      "cost": "2 per rank",
      "text": "You can control and move a mass of an element like air, earth, or water. Your power's effective Strength equals its rank, which is also the mass rank of the element you can move at once.",
      "effect": "Perception Ranged Move Object, Limited to Element",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Elongation",
      "kind": "effect",
      "type": "General",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "1 per rank",
      "text": "You can elongate your body and/or limbs to extend your reach. Add your effect rank to your normal size rank to determine how far you can elongate; for a normal-sized human (size rank ­2) this is 15 feet at rank 1, 30 feet at rank 2, and so forth.",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Energy Absorption",
      "kind": "sample",
      "type": "General",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "See description",
      "text": "You take the energy from a particular type of attack, chosen when you take this power, and use it to enhance one of your traits. Typically this is either Strength or a Ranged Damage effect of the same energy type as the initial attack, but other traits are possible, including Quickness, Regeneration, Speed, or the…",
      "effect": "Enhanced Trait, Fades, Reaction",
      "perRank": null,
      "flat": null
    },
    {
      "name": "Energy Aura",
      "kind": "sample",
      "type": "Attack",
      "action": "Reaction",
      "range": "Close",
      "duration": "Instant",
      "resist": "Toughness",
      "cost": "4 per rank",
      "text": "You can surround your body with an aura of damaging energy or some similar effect. Anyone you touch or that touches you must make a Toughness resistance check against your aura's Damage rank.You can turn your aura on and off at will as a free action.",
      "effect": "Damage, Reaction",
      "perRank": 4,
      "flat": null
    },
    {
      "name": "Energy Control",
      "kind": "sample",
      "type": "Attack",
      "action": "Standard",
      "range": "Ranged",
      "duration": "Instant",
      "resist": "Toughness",
      "cost": "2 per rank",
      "text": "You can generate and project a type of energy, such as cold, electricity, fire, kinetic force, magnetism, radiation, or even cosmic energy, in a damaging blast (see the Blast power). Energy Control is further defined by the addition of Alternate Effects (see Alternate Effects, page 188), expanding what you can do with…",
      "effect": "Ranged Damage",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Enhanced Trait",
      "kind": "effect",
      "type": "General",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "As base trait",
      "text": "You can temporarily improve one of your existing traits, chosen when you take this effect. While this effect is active, you increase the affected trait by its rank.",
      "perRank": null,
      "flat": null
    },
    {
      "name": "Environment",
      "kind": "effect",
      "type": "Control",
      "action": "Standard",
      "range": "Rank",
      "duration": "Sustained",
      "resist": null,
      "cost": "1-2 per rank",
      "text": "You can change the environment in an area: raising or lowering the temperature, creating light, causing rain, and so forth (see The Environment in the Action & Adventure chapter for details). Your Environment affects a 30 foot radius around you at rank 1.",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Extra Limbs",
      "kind": "effect",
      "type": "General",
      "action": "None",
      "range": "Personal",
      "duration": "Permanent",
      "resist": null,
      "cost": "1 per rank",
      "text": "You have extra manipulative limbs, such as arms, tentacles, or even prehensile hair or a tail. Each rank in this effect grants you an extra limb.",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Feature",
      "kind": "effect",
      "type": "General",
      "action": "None",
      "range": "Personal",
      "duration": "Permanent",
      "resist": null,
      "cost": "1 per rank",
      "text": "You have one or more minor features, effects granting you an occasionally useful ability, one per rank. This effect is essentially a version of the Benefit advantage (see page 134) but a power rather than a virtue of skill, talent, or social background.",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Flight",
      "kind": "effect",
      "type": "Movement",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "2 per rank",
      "text": "You can fly through the air, including hovering in place. You have a flight speed rank equal to your effect rank.",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Force Field",
      "kind": "sample",
      "type": "Defense",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "1 per rank",
      "text": "You can surround your body with a protective field of energy or force, providing you with a Toughness increase equal to your rank. As a sustained effect, your Force Field is noticeable, unless you apply the Subtle modifier.",
      "effect": "Protection, Sustained",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Growth",
      "kind": "effect",
      "type": "General",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "2 per rank",
      "text": "You can temporarily increase your size, gaining Strength and Stamina at the cost of becoming a bigger, heavier, less agile target, unable to maneuver through small spaces. Growth modifiers are restricted by power level limits.",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Healing",
      "kind": "effect",
      "type": "General",
      "action": "Standard",
      "range": "Close",
      "duration": "Instant",
      "resist": null,
      "cost": "2 per rank",
      "text": "You can heal Damage conditions by touching a subject and taking a standard action to make a DC 10 Healing check. Each degree of success healing one Damage condition, starting with the subject's worst condition, and working down, as if the subject were recovering rapidly.",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Illusion",
      "kind": "effect",
      "type": "Control",
      "action": "Standard",
      "range": "Perception",
      "duration": "Sustained",
      "resist": "Awareness",
      "cost": "1-5 per rank",
      "text": "You can control others'senses to create false impressions, illusions. This can range from visual images to phantom sounds, smells, or even radar or mental images.",
      "perRank": 5,
      "flat": null
    },
    {
      "name": "Immortality",
      "kind": "effect",
      "type": "Defense",
      "action": "None",
      "range": "Personal",
      "duration": "Permanent",
      "resist": null,
      "cost": "2 per rank",
      "text": "You can recover from death! If your condition becomes dead, you return to life after a time.",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Immunity",
      "kind": "effect",
      "type": "Defense",
      "action": "None",
      "range": "Personal",
      "duration": "Permanent",
      "resist": null,
      "cost": "1 per rank",
      "text": "You are immune to certain effects, automatically succeeding on any resistance check against them. You assign ranks of Immunity to various effects to gain immunity to them (with more extensive effects requiring more ranks).",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Insubstantial",
      "kind": "effect",
      "type": "General",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "5 per rank",
      "text": "You can assume a less solid form, with each Insubstantial rank becoming progressively less solid. You do not gain the ability to assume lower-ranked Insubstantial forms at higher ranks, but you can acquire a lower-ranked form as an Alternate Effect of a higher-ranked one.",
      "perRank": 5,
      "flat": null
    },
    {
      "name": "Invisibility",
      "kind": "sample",
      "type": "Sensory",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "4 or 8 points",
      "text": "You can vanish from sight at will, gaining total visual concealment, although other senses can still detect you. This power costs 4 points if you are only invisible to normal vision, 8 points if you cannot be detected by any visual sense (including infrared and ultraviolet).",
      "effect": "Visual Concealment",
      "perRank": null,
      "flat": null
    },
    {
      "name": "Leaping",
      "kind": "effect",
      "type": "Movement",
      "action": "Free",
      "range": "Personal",
      "duration": "Instant",
      "resist": null,
      "cost": "1 per rank",
      "text": "You can make prodigious leaps, far more than even a skilled athlete. Your Leaping rank, minus 2, is the distance rank you cover in a single standing jump: so 15 feet at rank 1, 30 feet at rank 2, up to 1,000 miles at rank 20!You do not suffer any damage from landing after a jump, so long as it is within your maximum…",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Luck Control",
      "kind": "effect",
      "type": "Control",
      "action": "Reaction",
      "range": "Perception",
      "duration": "Instant",
      "resist": null,
      "cost": "3 per rank",
      "text": "You can use hero points or ranks of Luck to affect others in various ways (see Hero Points, page 20). For each rank you have in this effect, choose one of the following capabilities: • You can spend a hero point or use Luck on another character's behalf, with the normal benefits.",
      "perRank": 3,
      "flat": null
    },
    {
      "name": "Magic",
      "kind": "sample",
      "type": "Attack",
      "action": "Standard",
      "range": "Ranged",
      "duration": "Instant",
      "resist": "Toughness",
      "cost": "2 per rank",
      "text": "You are a sorcerer, witch, or wizard, able to cast a variety of magical spells. Your basic default effect is a Blast of eldritch force, able to inflict Ranged Damage (see the Blast power, previously).",
      "effect": "Ranged Damage",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Mental Blast",
      "kind": "sample",
      "type": "Attack",
      "action": "Standard",
      "range": "Perception",
      "duration": "Instant",
      "resist": "Will",
      "cost": "4 per rank",
      "text": "4 points per rank You can strike targets' minds with \"mental force,\" inflicting Damage resisted by the target's Will rather than Toughness, but having no effect on targets immune to effects resisted by Will, such as inanimate objects. Mental Blasts are often, but not always, Subtle as well, which costs a flat 1 point.",
      "effect": "Perception Ranged Damage, Resisted by Will",
      "perRank": 4,
      "flat": null
    },
    {
      "name": "Mimic",
      "kind": "sample",
      "type": "General",
      "action": "Move",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "8 per rank",
      "text": "You can duplicate the traits of another character you can perceive, requiring a move action to scan them.You gain (Mimic rank x 5) power points worth of traits the target has, up to a maximum of the target's rank, and limited by the total power points you can Mimic. If you can only mimic some traits, apply the Limited…",
      "effect": "Variable, Move Action",
      "perRank": 8,
      "flat": null
    },
    {
      "name": "Mind Control",
      "kind": "sample",
      "type": "Attack",
      "action": "Standard",
      "range": "Perception",
      "duration": "Instant",
      "resist": "Will",
      "cost": "4 per rank",
      "text": "You can impose your will on others, forcing them to obey your commands. Targets failing a Will resistance check against your effect DC first become dazed, then compelled, as they try to fight off your influence.",
      "effect": "Perception Ranged, Cumulative Affliction, Resisted by Will",
      "perRank": 4,
      "flat": null
    },
    {
      "name": "Mind Reading",
      "kind": "effect",
      "type": "Sensory",
      "action": "Standard",
      "range": "Perception",
      "duration": "Sustained",
      "resist": "Will",
      "cost": "2 per rank",
      "text": "You can read another character's mind. To use Mind Reading, make an opposed effect check against the result of the target's Will check.",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Morph",
      "kind": "effect",
      "type": "General",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "5 per rank",
      "text": "You can alter your appearance. Your traits do not change; your new form is merely a cosmetic change.You gain a +20 bonus to Deception checks to disguise yourself as the form you assume (see the Disguise guidelines for Deception).",
      "perRank": 5,
      "flat": null
    },
    {
      "name": "Move Object",
      "kind": "effect",
      "type": "Control",
      "action": "Standard",
      "range": "Ranged",
      "duration": "Sustained",
      "resist": "Strength",
      "cost": "2 per rank",
      "text": "You can move objects at a distance without touching them. Move Object has no action/reaction; a moving object cannot drag the character \"holding on\" to it, for example.",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Movement",
      "kind": "effect",
      "type": "Movement",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "2 per rank",
      "text": "You have a special form of movement. For each rank in this effect, choose one of the following options:",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Nullify",
      "kind": "effect",
      "type": "Attack",
      "action": "Standard",
      "range": "Ranged",
      "duration": "Instant",
      "resist": "Rank/Will",
      "cost": "1 per rank",
      "text": "Nullify can counter particular effects of a particular descriptor, such as fire effects, magical effects, mental effects, and so forth (see Countering Effects, at the start of this chapter). You can counter one effect of your chosen descriptor per use of Nullify.You can't nullify innate effects (see the Innate…",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Power-Lifting",
      "kind": "sample",
      "type": "General",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "1 per rank",
      "text": "per rank Your lifting and carrying capacity is out of proportion with the rest of your Strength. Each rank in this power gives you +1 to your Strength rank for determining how much weight you can lift and carry, but does not increase your Strength damage or other effects of your Strength rank.",
      "effect": "Enhanced Strength, Limited to Lifting",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Protection",
      "kind": "effect",
      "type": "Defense",
      "action": "None",
      "range": "Personal",
      "duration": "Permanent",
      "resist": null,
      "cost": "1 per rank",
      "text": "Protection shields you against damage, giving you +1 to your Toughness defense per rank. So Protection 4 gives you +4 Toughness.",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Quickness",
      "kind": "effect",
      "type": "General",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "1 per rank",
      "text": "You can perform routine tasks--anything that can be done as a routine check (see Routine Checks in The Basics chapter)--fast, perhaps very fast. Subtract your effect rank from the normal time rank to perform a task to determine how long it takes you.",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Regeneration",
      "kind": "effect",
      "type": "Defense",
      "action": "None",
      "range": "Personal",
      "duration": "Permanent",
      "resist": null,
      "cost": "1 per rank",
      "text": "You recover quickly from damage. Remove penalties to your Toughness checks due to damage equal to your Regeneration rank each minute.",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Remote Sensing",
      "kind": "effect",
      "type": "Sensory",
      "action": "Free",
      "range": "Rank",
      "duration": "Sustained",
      "resist": null,
      "cost": "1-5 per rank",
      "text": "You can displace one or more of your senses over a distance, perceiving as if you were at that location, up to 60 feet away. Each additional rank increases your range one distance rank, so rank 2 is 120 feet, rank 3 is 250 feet, and so on.",
      "perRank": 5,
      "flat": null
    },
    {
      "name": "Senses",
      "kind": "effect",
      "type": "Sensory",
      "action": "None",
      "range": "Personal",
      "duration": "Permanent",
      "resist": null,
      "cost": "1 per rank",
      "text": "One or more of your senses are improved, or you have additional sensory abilities beyond the normal five senses. Allocate ranks in Senses to the following effects.",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Shapeshift",
      "kind": "sample",
      "type": "General",
      "action": "Move",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "8 per rank",
      "text": "per rank You can transform into different forms, gaining the physical traits (abilities, skills, advantages, and powers) of the assumed form. You gain (Shapeshift rank x 5) power points worth of traits.",
      "effect": "Variable (assumed forms), Move Action",
      "perRank": 8,
      "flat": null
    },
    {
      "name": "Shrinking",
      "kind": "effect",
      "type": "General",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "2 per rank",
      "text": "You can temporarily decrease your size, becoming smaller, harder to see -- and hit -- at the cost of losing Strength and speed. Every 4 ranks of Shrinking reduces your size rank by 1 (normal humans are size rank ­2 by default) and each reduction in size rank subtracts 1 from your Strength and every two reductions in…",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Sleep",
      "kind": "sample",
      "type": "Attack",
      "action": "Standard",
      "range": "Ranged",
      "duration": "Instant",
      "resist": "Fortitude",
      "cost": "2 per rank",
      "text": "2 points per rank You cause a the target to feel tremendous weariness. Targets failing the Fortitude resistance check against your effect DC become fatigued, then exhausted, and finally asleep as they succumb.",
      "effect": "Ranged Affliction, Resisted by Fortitude",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Snare",
      "kind": "sample",
      "type": "Attack",
      "action": "Standard",
      "range": "Ranged",
      "duration": "Instant",
      "resist": "Dodge",
      "cost": "3 per rank",
      "text": "You can restrain a target with bonds of ice, glue, webbing, bands of energy, and so forth (whatever suits your descriptors).The target makes a Dodge resistance check against your effect DC. One degree of failure leaves the target hindered and vulnerable, while two results in the target becoming defenseless and…",
      "effect": "Ranged, Cumulative Affliction, Extra Condition, Resisted by Dodge, Limited Degree",
      "perRank": 3,
      "flat": null
    },
    {
      "name": "Speed",
      "kind": "effect",
      "type": "Movement",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "1 per rank",
      "text": "You can move faster than normal. You have a ground speed rank equal to your effect rank.This also improves all forms of movement based on ground speed.",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Strike",
      "kind": "sample",
      "type": "Attack",
      "action": "Standard",
      "range": "Close",
      "duration": "Instant",
      "resist": "Toughness",
      "cost": "1 per rank",
      "text": "You inflict additional damage in close combat. Your Strike either substitutes for your Strength damage or adds to it, if it is Strength-based, see the Damage effect for details.",
      "effect": "Damage",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Suffocation",
      "kind": "sample",
      "type": "Attack",
      "action": "Standard",
      "range": "Ranged",
      "duration": "Instant",
      "resist": "Fortitude",
      "cost": "4 per rank",
      "text": "You render the target unable to breathe. Targets failing the Fortitude resistance check against your effect DC become dazed, stunned, and finally incapacitated, passing out from the lack of oxygen.",
      "effect": "Ranged, Progressive Affliction, Resisted by Fortitude",
      "perRank": 4,
      "flat": null
    },
    {
      "name": "Summon",
      "kind": "effect",
      "type": "Control",
      "action": "Standard",
      "range": "Close",
      "duration": "Sustained",
      "resist": null,
      "cost": "2 per rank",
      "text": "You can call upon another creature--a minion--to aid you. This creature is created as an independent character with (effect rank x 15) power points.",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Super-Speed",
      "kind": "sample",
      "effect": "Enhanced Initiative, Quickness, Speed",
      "cost": "3 points",
      "text": "per rank You are fast! Each rank of Super-Speed gives you the effects of Improved Initiative as an Enhanced Trait, Quickness, and Speed, with a ground speed rank equal to your power rank.",
      "perRank": null,
      "flat": 3
    },
    {
      "name": "Swimming",
      "kind": "effect",
      "type": "Movement",
      "action": "Free",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "1 per rank",
      "text": "You can swim fast. You have a water speed equal to your Swimming rank ­2, subject to the usual rules for swimming (see the Athletics skill description for details).",
      "perRank": 1,
      "flat": null
    },
    {
      "name": "Teleport",
      "kind": "effect",
      "type": "Movement",
      "action": "Move",
      "range": "Rank",
      "duration": "Instant",
      "resist": null,
      "cost": "2 per rank",
      "text": "You can move instantly from place to place without crossing the distance in between. You can teleport yourself and up to 50 lbs.",
      "perRank": 2,
      "flat": null
    },
    {
      "name": "Transform",
      "kind": "effect",
      "type": "Control",
      "action": "Standard",
      "range": "Close",
      "duration": "Sustained",
      "resist": null,
      "cost": "2-5 per rank",
      "text": "You can change objects into other objects, altering their shape or material composition in the process. You must touch the chosen object, which requires a close attack check if the object is held or worn by another character.",
      "perRank": 5,
      "flat": null
    },
    {
      "name": "Variable",
      "kind": "effect",
      "type": "General",
      "action": "Standard",
      "range": "Personal",
      "duration": "Sustained",
      "resist": null,
      "cost": "7 per rank",
      "text": "You can gain or use potentially any effect of the appropriate type and descriptor! AVariable effect provides you with a set of (rank x 5) power points you can allocate to different effects.",
      "perRank": 7,
      "flat": null
    },
    {
      "name": "Weaken",
      "kind": "effect",
      "type": "Attack",
      "action": "Standard",
      "range": "Close",
      "duration": "Instant",
      "resist": "Fort.",
      "cost": "or Will 1 per rank",
      "text": "You can temporarily lower one of a target's traits, chosen when this effect is acquired. You must touch the target, making a normal close attack check.",
      "perRank": 1,
      "flat": null
    }
  ],
  "complications": [
    {
      "name": "Motivation: Acceptance",
      "group": "Motivation",
      "text": "The hero feels different or isolated (perhaps for being a non-human in human society) and does good to gain the trust and acceptance of others and perhaps discover what it means to be human. Some such heroes see their powers as more of a curse than a blessing, but try to do some good with them while hoping and looking for a way to have a normal life."
    },
    {
      "name": "Motivation: Doing Good",
      "group": "Motivation",
      "text": "Some heroes fight the good fight simply because it's the right thing to do and they believe in doing the right thing no matter what. Their strong moral center may come from a good upbringing (or a bad one that showed them what not to do) or the guidance or inspiration of a mentor or idol."
    },
    {
      "name": "Motivation: Greed",
      "group": "Motivation",
      "text": "There are those motivated by nothing more than the opportunity to make a profit off their heroic careers. They may be mercenaries for hire or marketing machines who do good deeds but also rake in the proceeds from licensing fees and public appearances. More altruistic heroes tend to look down upon their profit-mongering peers."
    },
    {
      "name": "Motivation: Justice",
      "group": "Motivation",
      "text": "Anoverwhelmingthirstforjusticedrivessome heroes, a need to see the innocent protected and the guilty punished, even if they are beyond the reach of the law.These heroes walk a thin line. For some justice becomes a thirst for vengeance for injury done to the hero in the past, like the death of a loved one."
    },
    {
      "name": "Motivation: Patriotism",
      "group": "Motivation",
      "text": "Heroes are often devoted to the ideals of their home (or adopted) nation, and seek to serve that nation and its people with their abilities. Patriotic heroes are often honored as champions of their homelands, but it is the service, and not necessarily the recognition, that matters."
    },
    {
      "name": "Motivation: Recognition",
      "group": "Motivation",
      "text": "Some heroes just want recognition or attention, and dressing up in a bright costume and fighting crime is one surefire way to get people to notice you.The hero may be a shy nobody out of costume or a glory-hog who loves the spotlight."
    },
    {
      "name": "Motivation: Responsibility",
      "group": "Motivation",
      "text": "The responsibility of having great power can be a heavy burden but some heroes feel it is their duty to use the powers they've been given for the greater good. Oftentimes these heroes are trying to live up to an ideal like a mentor or a predecessor who inspired them."
    },
    {
      "name": "Motivation: Thrills",
      "group": "Motivation",
      "text": "For some the life of a superhero is all about excitement, thrills, danger, and challenge. These heroes are in it for the action more than anything else."
    },
    {
      "name": "Accident",
      "group": "Complication",
      "text": "You cause or suffer some sort of accident. Perhaps a stray blast damages a building or hurts an innocent bystander, your fire powers set off sprinkler systems, or you cause volatile chemicals to explode. A hero with this as a regular complication may be especially accident-prone, inexperienced with their powers, or even jinxed!"
    },
    {
      "name": "Addiction",
      "group": "Complication",
      "text": "You need something, whether for physical or psychological reasons.You'll go out of your way to satisfy your addiction, and being unable to satisfy it may lead to other complications, either involving your own faculties or your relationships with people. Several comic book heroes have struggled with various addictions and the effects on their lives."
    },
    {
      "name": "Disability",
      "group": "Complication",
      "text": "You are limited by a particular disability, such as being blind, deaf, or paraplegic. When your disability places serious challenges in your path, your complication comes into play. Many \"disabled\" heroes have powers or other compensations for their disabilities, such as a blind hero with other enhanced senses or a paraplegic who is a powerful psychic with matchless mobility of mind over body."
    },
    {
      "name": "Enemy",
      "group": "Complication",
      "text": "You have an enemy, or enemies, trying to do you harm. The GM can have your enemy show up to cause you trouble, and adventures involving your enemy tend to be more complicated for you; even personal grudge-matches, if the enmity goes both ways. When having an enemy causes a particular problem for you (such as your enemy abducting a loved one or laying a trap for you), you get a hero point."
    },
    {
      "name": "Fame",
      "group": "Complication",
      "text": "You're a public figure, known almost everywhere you go, hounded by the media, swamped by fans and well-wishers, and similar problems, which create various complications."
    },
    {
      "name": "Hatred",
      "group": "Complication",
      "text": "You have an irrational hatred of something, leading you to actively oppose the object of your dislike in some way, no matter the consequences. Complications involving your hatred tend to overwhelm your better judgment."
    },
    {
      "name": "Honor",
      "group": "Complication",
      "text": "You have a strong personal code of honor. Generally this means you won't take unfair advantage of opponents or use trickery, but you can define the exact terms of your code with the GM.Your honor becomes a complication when it puts you in a bind or on the horns of a moral dilemma."
    },
    {
      "name": "Identity",
      "group": "Complication",
      "text": "Heroes often maintain secret identities, creating various complications as they try to keep them secret from friends and enemies alike.The dual-identity can even go beyond mere disguise for heroes who actually transform into a different persona, creating complications around controlling that transformation, or a lack of powers or abilities in one persona."
    },
    {
      "name": "Obsession",
      "group": "Complication",
      "text": "You're obsessed with a particular subject and pursue it to the exclusion of all else, which can create quite a few complications."
    },
    {
      "name": "Phobia",
      "group": "Complication",
      "text": "You're irrationally afraid of something.When confronted with it you have to fight to control your fear, causing you to hesitate, flee, or act irrationally."
    },
    {
      "name": "Power Loss",
      "group": "Complication",
      "text": "Certain circumstances cause some or all of your powers to fail or stop working, or rob you of them altogether. You might depend on particular objects others can steal or take from you, or lose your powers during the dark of the moon, or when exposed to exotic radiation. You may even simply lose faith in yourself, resulting in temporary weakness."
    },
    {
      "name": "Temper",
      "group": "Complication",
      "text": "Certain things just set you off.When you lose your temper you lash out at whatever provoked you."
    },
    {
      "name": "Weakness",
      "group": "Complication",
      "text": "Some things can hurt you, badly. You might have a weakness that overcomes your normally strong defenses, like a werewolf is vulnerable to silver, or you may suffer harm from things that are harmless to others, from water to cold iron or exotic energies or materials. A weakness may add degrees of effect or impose an entirely different effect."
    },
    {
      "name": "Prejudice",
      "group": "Complication",
      "text": "You are part of a minority group subject to the prejudices of others, which create problems. Similarly, characters with unusual origins or appearance might face prejudice, such as a demonic-looking hero who is considered suspect. Some Gamemasters and gaming groups may prefer not to deal with issues of prejudice in their games, in which case the GM is free to ban this complication."
    },
    {
      "name": "Quirk",
      "group": "Complication",
      "text": "Complications can often come from various personality quirks: likes, dislikes, hobbies, neuroses, and so forth. For example, a hero might have the quirk of always leaving some sort of\"calling card\"for the authorities along with a captured criminal. That could become a complication if somebody else starts imitating it, or uses it to cause trouble for the hero."
    },
    {
      "name": "Relationship",
      "group": "Complication",
      "text": "The important people in a hero's life are a source of strength, but they can also complicate matters considerably. If they are not in on the hero's costumed identity, then there is juggling two lives and keeping loved ones safely in the dark. On the other hand, if the people in a hero's life do know the truth, they are in danger from the hero's foes and others seeking to find out."
    },
    {
      "name": "Reputation",
      "group": "Complication",
      "text": "You have a bad reputation, affecting what others think of you (whether you deserve it or not). Having someone adopt a bad attitude toward you because of your reputation is a complication. You might struggle to overcome your reputation, taking chances or facing difficulties others do not as a result."
    },
    {
      "name": "Responsibility",
      "group": "Complication",
      "text": "You have various demands on your time and attention. Responsibilities include family obligations, professional duties, and similar things. Failing to live up to your responsibilities can mean loss of relationships, employment, and other problems."
    },
    {
      "name": "Rivalry",
      "group": "Complication",
      "text": "You feel a strong sense of competition with a person or group and have to do your best to outdo your rival at every opportunity."
    },
    {
      "name": "Secret",
      "group": "Complication",
      "text": "You have something potentially damaging or embarrassing you're hiding from the world. The most common secret for MUTANTS & MASTERMINDS UNDER THE HOOD: COMPLICATIONS AND UP-FRONT REWARDS Some roleplaying game systems include complications, disadvantages, or similar problematic character traits which offer \"bonus points\"for creating the character; essentially, you get more points for your character's good traits when…"
    }
  ]
};
