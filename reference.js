/* =============================================================================
 * Rules reference — the content of the "Checks" popup.
 *
 * This file is DATA ONLY. app.js reads window.REFERENCE and draws the popup
 * from it, so you can add, edit or remove entries here without touching the
 * app logic. Keep it loaded before app.js (see index.html).
 *
 * FORMAT
 *   window.REFERENCE = [ section, section, ... ]
 *   section = { title: 'Making checks', entries: [ entry, entry, ... ] }
 *   entry   = {
 *     name:      'Degrees',                  // heading of the entry
 *     text:      'One paragraph',             // or an ARRAY of paragraphs
 *     rows:      [['Bruised', '-1 on ...']],  // optional 2-column table
 *     table:     { head: ['Use', 'DC', 'Notes'],  // optional multi-column
 *                  rows: [['Climb', 'DC 10', '...']] }   //   table with a header
 *     condition: 'Dazed',                     // optional: links the entry to a
 *                                             //   condition chip, so it is
 *                                             //   highlighted while active
 *     verify:    true,                        // optional: shows a red "check vs
 *                                             //   book" tag for text you are
 *                                             //   not sure about yet
 *   }
 *
 * Source: Mutants & Masterminds Deluxe Hero's Handbook (Green Ronin), checked
 * against the book text: The Basics (checks, conditions, extra effort, hero
 * points), Abilities, Skills, Action & Adventure (initiative, critical hits,
 * damage, recovery, concealment, cover, minions, maneuvers) and the Affliction
 * and Weaken effects in Powers. Page numbers are the Deluxe edition's.
 * ========================================================================== */
/* Shown at the top of the popup only while every tab is lit and nothing is
 * typed in the filter. One paragraph, or an array of paragraphs. */
window.REFERENCE_INTRO = [
    'A quick rules reference for the table. Everything here is summarised from the Mutants & Masterminds Deluxe Hero\u2019s Handbook, and the page number in brackets at the end of an entry points to where it is in that book. Tap a tab above to see just that section; tap it again to come back to this full view. The filter box searches every entry. Entries for conditions that are active on the open stat block are highlighted.',
];

window.REFERENCE = [    {
        title: 'Making checks',
        entries: [
            {
                name: 'The basic check',
                text: 'Check = d20 + rank (ability, skill, power or other trait) vs. Difficulty Class. A result equal to or higher than the DC succeeds; lower fails. Resistance checks and some other rolls are not actions and take no time. (p. 12)',
            },
            {
                name: 'Degrees of success and failure',
                text: [
                    'Just succeeding or failing is one degree. Every full 5 points the result is over or under the DC adds a degree; fractions are ignored. So against DC 10, a 13 is one degree of success and an 8 is one degree of failure.',
                    'There is no limit to degrees, though more than two degrees of failure rarely matters. When a rule just says "success" or "failure", one degree is enough. (p. 14)',
                ],
                rows: [
                    ['DC + 15', 'Four degrees of success'],
                    ['DC + 10', 'Three degrees of success'],
                    ['DC + 5', 'Two degrees of success'],
                    ['DC', 'One degree of success'],
                    ['DC – 5', 'One degree of failure'],
                    ['DC – 10', 'Two degrees of failure'],
                    ['DC – 15', 'Three degrees of failure'],
                    ['DC – 20', 'Four degrees of failure'],
                ],
            },
            {
                name: 'Critical success',
                text: 'A natural 20 on any check is a critical success: work out the degree of success normally, then increase it by one degree. This can turn a failure into a success. On an attack check it is a critical hit (see Combat checks). (p. 13)',
            },
            {
                name: 'Difficulty Class guide',
                text: 'Set by the GM. Examples from the book: notice something in plain sight is Very easy; hear an approaching guard is Average; disarm an explosive is Tough; climb a wet, slippery rock face is Formidable; overcome a sophisticated security system is Heroic. (p. 13)',
                rows: [
                    ['Very easy', 'DC 0'],
                    ['Easy', 'DC 5'],
                    ['Average', 'DC 10'],
                    ['Tough', 'DC 15'],
                    ['Challenging', 'DC 20'],
                    ['Formidable', 'DC 25'],
                    ['Heroic', 'DC 30'],
                    ['Super-heroic', 'DC 35'],
                    ['Nigh-impossible', 'DC 40'],
                ],
            },
            {
                name: 'Routine checks',
                text: 'When you are not under any pressure, do not roll: treat the d20 as a 10. A +0 bonus therefore always manages DC 10, and a +10 bonus handles DC 20 routinely. The GM decides when a task is routine. If your routine result is not enough, you may still roll. (p. 13)',
            },
            {
                name: 'Opposed checks',
                text: [
                    'Both characters roll; the higher result wins (the other’s result is your DC). On a tie the character with the higher bonus wins. If the bonuses are equal too, roll a d20: 1–10 one character wins, 11–20 the other, decided before rolling.',
                    'Routine opposition: if the opponent is not actively opposing you (a guard not expecting anyone), the DC is their modifier + 10 instead of a roll. Active defenses in combat work this way, which is why attack checks target defense + 10. (p. 14)',
                ],
            },
            {
                name: 'Comparison checks',
                text: 'When it is a straight test of rank against rank with no luck involved, such as arm-wrestling or a race, do not roll: the higher rank simply wins. Equal ranks: roll a d20, 1–10 the first character wins, 11–20 the second. (p. 14)',
            },
            {
                name: 'Circumstance modifiers',
                text: 'A favourable or unfavourable situation gives +2 / –2 for a minor bonus or penalty and +5 / –5 for a major one. Impaired is a –2 circumstance penalty and Disabled a –5. Working without needed tools is –5, or –2 with makeshift tools. (p. 15)',
            },
            {
                name: 'Team checks',
                text: 'One character leads and makes the check normally. Each helper makes the same kind of check against DC 10 and their degrees of success and failure are added together. (p. 16)',
                rows: [
                    ['1–2 degrees of success', 'Leader gets +2'],
                    ['3 or more degrees', 'Leader gets +5 (the maximum)'],
                    ['1 degree of failure', 'No modifier'],
                    ['2 or more degrees of failure', 'Leader gets –2 (the maximum)'],
                ],
            },
            {
                name: 'Extra effort',
                text: [
                    'A free action, once per turn, declared by the player. Choose one benefit: an extra standard action; a +2 circumstance bonus on one check (or upgrade an existing +2 to +5, cancel a –2, or reduce a –5 to –2); +1 rank on one power effect until your next turn; a power stunt (a temporary Alternate Effect); an immediate extra resistance check against an ongoing effect; a retry some effects require; or +1 speed rank or +1 Strength rank until your next turn. Not limited by power level.',
                    'Cost: at the start of your next turn you become Fatigued. Fatigued becomes Exhausted, and Exhausted becomes Incapacitated. Spending a hero point at the start of that turn removes the fatigue entirely. If you are Compelled or Controlled the fatigue waits until you are free. (p. 19)',
                ],
            },
            {
                name: 'Hero points',
                text: 'Players start each session with 1 hero point and earn more from complications, heroism and roleplaying; unspent points do not carry over. Spending one is a reaction and you may spend as many as you have. Uses: (p. 20)',
                rows: [
                    ['Improve roll', 'Re-roll any die roll you make and take the better result. If the second roll is 1–10, add 10 to it, so the re-roll is always 11–20. Must be spent before the GM announces the outcome.'],
                    ['Recover', 'Immediately remove a Dazed, Fatigued or Stunned condition without taking an action, or turn Exhausted into Fatigued. Also lets you use extra effort without fatigue.'],
                    ['Heroic feat', 'Gain one rank of an advantage you lack (not a fortune advantage) until the end of your next turn.'],
                    ['Edit scene', 'Add or change a detail of the scene to your advantage, with GM approval; it cannot undo anything that has already happened.'],
                    ['Inspiration', 'A hint, clue or bit of help from the GM.'],
                    ['Instant counter', 'Attempt to counter an effect used against you, as a reaction.'],
                ],
            },
        ],
    },
    {
        title: 'Ability checks',
        entries: [
            {
                name: 'When to roll an ability',
                text: 'Ability check = d20 + ability rank. Roll it when no skill covers the task: a Strength check to force a door, an Intellect check to puzzle something out, a Presence check to hold a crowd. Rank 0 is an average adult; ranks run from \u20135 to 20 and beyond. (p. 107)',
                rows: [
                    ['\u20135 / \u20134 / \u20133', 'Inept or disabled / weak, infant / younger child'],
                    ['\u20132 / \u20131', 'Child or elderly / below average, teenager'],
                    ['0 / 1 / 2', 'Average adult / above average / well above average'],
                    ['3 / 4 / 5', 'Gifted / highly gifted / best in a nation'],
                    ['6 / 7', 'One of the best in the world / best ever, peak of human achievement'],
                    ['8 / 10 / 13 / 15 / 20', 'Low / moderate / high / very high superhuman / cosmic'],
                ],
            },
            {
                name: 'Strength (STR)',
                text: 'Sheer muscle power. Adds to damage from unarmed and strength-based attacks, to how far you jump and how much you lift, carry and throw, and to Athletics checks. (p. 108)',
            },
            {
                name: 'Stamina (STA)',
                text: 'Health, endurance and physical resilience. The base of Toughness (resisting damage) and Fortitude (resisting effects on your health). Roll a Stamina check to resist or recover from something affecting your health when no defense applies. (p. 108)',
            },
            {
                name: 'Agility (AGL)',
                text: 'Balance, grace, speed and coordination. The base of Dodge and of your initiative bonus; adds to Acrobatics and Stealth. Roll an Agility check for feats of coordination, whole-body movement and quickness when no skill applies. (p. 108)',
            },
            {
                name: 'Dexterity (DEX)',
                text: 'Hand-eye coordination and precision. Adds to ranged attack checks and to Sleight of Hand and Vehicles. Roll a Dexterity check for fine control and precision when no skill applies. (p. 108)',
            },
            {
                name: 'Fighting (FGT)',
                text: 'Skill in close combat. Adds to close attack checks and is the base of Parry. (p. 108)',
            },
            {
                name: 'Intellect (INT)',
                text: 'Reasoning and learning. Adds to Expertise, Investigation, Technology and Treatment. Roll an Intellect check to solve a problem with sheer brainpower when no skill applies. (p. 108)',
            },
            {
                name: 'Awareness (AWE)',
                text: 'Common sense and intuition. The base of Will; adds to Insight and Perception. Roll an Awareness check for matters of intuition when no skill applies. (p. 108)',
            },
            {
                name: 'Presence (PRE)',
                text: 'Force of personality, persuasiveness and leadership. Adds to Deception, Intimidation and Persuasion. Roll a Presence check to influence others through sheer personality when no skill applies. (p. 108)',
            },
            {
                name: 'Defenses',
                text: 'Each defense starts at its ability rank and can be raised 1 point per power point, except Toughness, which only advantages and powers raise. An attack\u2019s DC is the defense + 10. Dodge and Parry are active defenses: halved while Vulnerable, 0 while Defenseless. (p. 110)',
                rows: [
                    ['Dodge', 'Agility. Avoids ranged attacks and reflex hazards.'],
                    ['Parry', 'Fighting. Avoids close attacks.'],
                    ['Fortitude', 'Stamina. Resists poison, disease and other threats to health.'],
                    ['Toughness', 'Stamina. Resists damage.'],
                    ['Will', 'Awareness. Resists mental and spiritual attacks.'],
                ],
            },
            {
                name: 'Power point costs',
                text: 'A hero starts with 15 power points per power level (150 at PL 10) and earns more through play. These costs are what the Power points section of the editor uses: abilities and defenses are read from the stat boxes, skills, advantages and powers from their lists, and only Other is typed in. Once spent, points cannot be moved without the GM\u2019s say-so. (p. 24, 107, 110, 113, 130)',
                rows: [
                    ['Starting points', 'Power level \u00d7 15'],
                    ['Earned points', 'Usually 1 per adventure or session, 2 for a hard one, plus a possible bonus at the end of a long one. Spent between adventures, limited by the series power level; the GM may raise the level once about 15 more points have been earned. (p. 262)'],
                    ['Abilities', '2 points per rank. A rank below 0 gives 2 points back per rank.'],
                    ['Defenses', '1 point per rank above the base ability. Toughness is raised only through advantages and powers.'],
                    ['Skills', '1 point per 2 ranks'],
                    ['Advantages', '1 point per rank'],
                    ['Equipment', 'The Equipment advantage gives 5 equipment points per rank to spend on gear (p. 130); the Equipment section appears while the advantage is on the sheet'],
                    ['Powers', 'Base cost per rank plus extras, minus flaws; see the Powers chapter'],
                ],
            },
        ],
    },
    {
        title: 'Skill checks',
        entries: [
            {
                name: 'How skill checks work',
                text: [
                    'Skill check = d20 + skill rank + the skill\u2019s ability modifier + other modifiers. Untrained you still roll with the ability modifier, but Trained Only skills fail automatically without at least 1 rank.',
                    'Interaction skills need a target who is aware of you and can understand you, else \u20135; targets of Intellect \u20135 are also \u20135, and anything lacking a mental ability is immune. Manipulation skills need hands or a Precise effect. Requires Tools means \u20135 without them. A +5 bonus handles DC 15 routinely, +10 handles DC 20, +15 handles DC 25. (p. 113)',
                ],
            },
            {
                name: 'All skills at a glance',
                text: 'Each skill\u2019s ability, whether it can be used untrained, the action it takes and its special rules. (p. 114)',
                table: {
                    head: ['Skill', 'Ability', 'Untrained', 'Action', 'Rules'],
                    rows: [
                        ['Acrobatics', 'AGL', 'No', 'Move or free', ''],
                        ['Athletics', 'STR', 'Yes', 'Move', ''],
                        ['Close Combat', 'FGT', 'Yes', 'Standard', 'One skill per attack'],
                        ['Deception', 'PRE', 'Yes', 'Standard (move at \u20135)', 'Interaction'],
                        ['Expertise', 'INT (varies)', 'Some fields', 'Varies', 'One skill per field'],
                        ['Insight', 'AWE', 'Yes', 'Free', ''],
                        ['Intimidation', 'PRE', 'Yes', 'Standard (move at \u20135)', 'Interaction'],
                        ['Investigation', 'INT', 'No', 'Longer than a round', ''],
                        ['Perception', 'AWE', 'Yes', 'Free (retry: move)', ''],
                        ['Persuasion', 'PRE', 'Yes', 'Standard or longer', 'Interaction'],
                        ['Ranged Combat', 'DEX', 'Yes', 'Standard', 'One skill per attack'],
                        ['Sleight of Hand', 'DEX', 'No', 'Standard', 'Manipulation'],
                        ['Stealth', 'AGL', 'Yes', 'Move', ''],
                        ['Technology', 'INT', 'No', 'Standard (building takes longer)', 'Manipulation, Requires Tools'],
                        ['Treatment', 'INT', 'No', 'Standard (care takes longer)', 'Manipulation, Requires Tools'],
                        ['Vehicles', 'DEX', 'No', 'Move', 'Manipulation'],
                    ],
                },
            },
            {
                name: 'Acrobatics',
                text: 'Agility. Trained Only. Move action, or free for some uses. (p. 115)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Balance', 'DC 0 a yard wide, 5 wide ledge, 10 narrow ledge, 15 balance beam, 20 tightrope. +2 / +5 slippery or uneven, +5 at full speed, +5 to avoid being Vulnerable', 'Move at speed \u20131. One degree of failure: no progress; two or more: you fall. Vulnerable while balancing.'],
                    ['Maneuver', 'DC 15, GM sets', 'Flip over a foe, tumble through obstacles. Two or more degrees of failure: Prone.'],
                    ['Stand from Prone', 'DC 20', 'As a free action instead of a move. Failure: stay prone.'],
                    ['Tumble (soften a fall)', 'DC 5', '\u20131 damage rank per degree. At rank 0 no damage and you land on your feet.'],
                    ['Contort', 'DC 30', 'Fit through a tight space.'],
                    ['Escape a grab', 'Opposed, Acrobatics or Athletics', 'See the Grab action.'],
                ] },
            },
            {
                name: 'Athletics',
                text: 'Strength. Move action. (p. 116)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Climb', 'DC 0 ladder, 5 knotted rope, 10 rope, 15 uneven rock face, 20 rough brick wall. \u201310 in a duct or chimney, \u20135 in a corner, \u20135 under 10 ft, +2 / +5 slippery, +5 for +1 speed, +5 to avoid being Vulnerable, \u20135 without needed gear', 'Move at speed \u20132. Failure: no progress; two or more degrees: you fall. Catch yourself with Athletics at the climb DC + 10.'],
                    ['Jump', 'Check result = feet of running long jump (routine: bonus + 10)', 'Standing long jump: half. Running vertical: a fifth. Standing vertical: a tenth.'],
                    ['Run', 'DC 15, free action', '+1 ground speed rank for one round.'],
                    ['Swim', 'DC 10. +5 rough water, +5 rescuing someone, +5 for +1 speed, +10 stormy water', 'Move at speed \u20132. Failure: no progress; two or more degrees: you go under.'],
                    ['Fall', '\u2014', 'Damage rank 4 + twice the distance rank, up to rank 16. Prone afterwards.'],
                ] },
            },
            {
                name: 'Close Combat',
                text: 'Fighting. Standard action. A separate skill for each specific close attack, such as Close Combat: Swords or Close Combat: Unarmed. (p. 117)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Attack with that weapon or power', 'vs. target\u2019s Parry + 10', 'Adds the skill rank to the attack check only, never to Parry. Unarmed does not cover grabs or trips. For a broad bonus see the Close Attack advantage.'],
                ] },
            },
            {
                name: 'Deception',
                text: 'Presence. Interaction. Standard action, or a move action at \u20135. (p. 118)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Bluff', 'Opposed by the target\u2019s Deception or Insight. Target gets \u20135 if they want to believe you, +0 believable, +5 a little hard or some risk, +10 hard or serious risk, +20 almost incredible', 'They believe the lie or go along with you.'],
                    ['Disguise', 'Your result = DC of observers\u2019 Perception. People who know the person you imitate get +2 (associates), +5 (friends), +10 (loved ones); poor props up to \u20135', 'At least 10 minutes to prepare. GM rolls secretly. Acting the part may also need Deception vs. Insight.'],
                    ['Feint', 'Opposed by the better of Deception or Insight', 'Target is Vulnerable against your next attack, until the end of your next round.'],
                    ['Innuendo', 'DC 10 basic message, 15 complex, 20 new or detailed information', 'Recipient needs Insight at the same DC. Eavesdroppers who make it notice a message; two degrees and they understand it.'],
                    ['Trick', 'Opposed by Deception or Insight', 'Foe acts heedless of a hazard, e.g. attacks you beside a ledge. More than one degree of failure: you are Vulnerable until your next round.'],
                ] },
            },
            {
                name: 'Expertise',
                text: 'Intellect, or another ability if the field calls for it. Trained Only, though the GM may allow easy untrained checks. Each field (Science, Law, Magic, Streetwise\u2026) is its own skill. (p. 119)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Everyday work in your field', 'Usually routine', 'You can make a living at it and supervise helpers.'],
                    ['Answer a question', 'DC 10 easy, 15 basic, 20 or more difficult', 'Usually routine; the GM may roll secretly.'],
                    ['Use a related field', '\u20132 or \u20135', 'GM decides how related it is.'],
                    ['Untrained general knowledge', 'DC 10 to 15 only', 'Never routine.'],
                ] },
            },
            {
                name: 'Insight',
                text: 'Awareness. Free action. (p. 120)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Resist influence', 'Opposed vs. a Deception or Intimidation check', 'Beat their result and you are unaffected.'],
                    ['Evaluate a person', 'Opposed by their Deception', 'Trustworthy or not. Two or more degrees of failure: you misread them.'],
                    ['Read a situation', 'DC 20', 'Overall mood and attitudes.'],
                    ['Detect an illusion', 'DC 10 + Illusion rank', 'GM rolls secretly; you sense a flaw.'],
                    ['Detect outside influence', 'DC 10 + effect or skill rank', 'Three or more degrees: a general idea of what, maybe who.'],
                    ['Catch an innuendo', 'Message DC', 'See Deception.'],
                ] },
            },
            {
                name: 'Intimidation',
                text: 'Presence. Interaction. Standard action, or a move action at \u20135. (p. 121)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Coerce', 'Opposed by the better of the target\u2019s Insight or Will defense. Bonus for an imposing display, penalty if they hold the upper hand', 'They cooperate as if friendly while you are present. More than one degree of failure: they may do the opposite. Their true attitude usually turns hostile afterwards.'],
                    ['Demoralize', 'Opposed by the better of Insight or Will defense', 'Impaired until the end of your next round. Four or more degrees: Disabled instead.'],
                    ['Cow a group of minions', 'One check vs. one resistance roll for the whole group', 'Same effect on everyone who can see and hear you.'],
                ] },
            },
            {
                name: 'Investigation',
                text: 'Intellect. Trained Only. Takes time rather than an action; the GM may roll secretly. (p. 122)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Search', 'DC 10 ransack for an object, 20 secret compartment, simple trap or obscure clue, 25 or more well hidden. An item someone hid: opposed by their Stealth or Sleight of Hand', 'Time rank = the area\u2019s distance rank + 2 (a small room: 1 minute; a square mile: 2 hours).'],
                    ['Gather evidence', 'DC 15', 'Failure: analysis at \u20135. More than one degree: evidence ruined. Two or more degrees of success: +2 to analysis.'],
                    ['Analyze evidence', 'DC 15. +2 per day since (max +10), +5 outdoors, +2 disturbed, +5 badly disturbed', 'Information from the clue, set by the GM. Two or more degrees of failure may mislead.'],
                    ['Gather information', 'DC 10, at least an hour', 'One degree: general gossip. Two: specific. Three: restricted. Four: protected. An extra degree of failure alerts someone.'],
                    ['Surveillance', 'Your result = DC of the subject\u2019s Stealth', 'Watching a place from one spot. Following someone is Stealth.'],
                ] },
            },
            {
                name: 'Perception',
                text: 'Awareness. Free action, or a move action to try again. \u20131 per 10 feet of distance. Making out details needs three degrees of success. The GM usually rolls secretly. (p. 123)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Hear', 'DC 0 conversation, 10 soft noise. +5 through a door, +15 through a wall, +10 to wake you. Or opposed by Stealth', ''],
                    ['See', 'DC 0 plain sight, 5 to 10 or more subtle. Or opposed by Stealth', 'Also used to spot a disguise or a concealed item.'],
                    ['Other senses', 'DC 0 obvious, 10 less obvious, 20 or more hidden', ''],
                    ['Make out details', 'Three degrees of success', 'Follow a conversation, read fine print.'],
                ] },
            },
            {
                name: 'Persuasion',
                text: 'Presence. Interaction. At least a standard action, usually longer. Attitudes run Hostile, Unfavorable, Indifferent, Favorable, Helpful. (p. 124)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Improve an attitude', 'DC 15', 'One step better, and another step per two extra degrees. More than one degree of failure: one step worse, and a hostile subject may attack.'],
                    ['Negotiate', 'Opposed Persuasion', 'Also for rival advocates before a third party.'],
                    ['Try again', '\u2014', 'Futile after a failure until the situation changes. A second success in the same scene checks against the original attitude.'],
                ] },
            },
            {
                name: 'Ranged Combat',
                text: 'Dexterity. Standard action. A separate skill for each specific ranged attack, such as Ranged Combat: Guns or Ranged Combat: Throwing. (p. 125)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Attack with that weapon or power', 'vs. target\u2019s Dodge + 10', 'Adds the skill rank to the attack check only, never to Dodge. For a broad bonus see the Ranged Attack advantage.'],
                ] },
            },
            {
                name: 'Sleight of Hand',
                text: 'Dexterity. Trained Only. Manipulation. Standard action. (p. 125)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Conceal a small item', 'Your result = DC to find it', 'Against Investigation or Perception.'],
                    ['Legerdemain', 'DC 10, or opposed by a watching observer\u2019s Perception', 'Coin tricks, vanishing a card.'],
                    ['Steal', 'DC 20', 'The target notices if their Perception beats your result, whether you got the item or not.'],
                    ['Plant an item', '20 or higher, regardless of their roll', 'Noticed as for stealing.'],
                    ['Escape restraints', 'DC 15 ropes, 20 handcuffs, 25 straitjacket, 15 + rank for a power', 'A minute per check.'],
                    ['Contort', 'DC 30', 'Through a space wide enough for your head but not your shoulders.'],
                ] },
            },
            {
                name: 'Stealth',
                text: 'Agility. Move action. Move at speed \u20131 freely; faster is \u20135. (p. 126)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Hide', 'Opposed by observers\u2019 Perception', 'Needs cover or concealment. Not possible while people are watching you.'],
                    ['Slip away after a distraction', 'Opposed, at \u20135', 'After a Deception or Intimidation check turns heads; cover within 1 foot per Stealth rank.'],
                    ['Tail someone', 'Opposed by their Perception at each change of course if suspicious, once per scene if not', 'If spotted, a Deception check opposed by Insight passes it off once. Spotted twice and they know.'],
                ] },
            },
            {
                name: 'Technology',
                text: 'Intellect. Trained Only. Manipulation. Requires Tools (\u20135 without). Standard action for most uses. Inventing needs the Inventor advantage. (p. 127)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Operate an unfamiliar device', 'DC 10 simple to 25 or more highly advanced', 'Known devices need no check.'],
                    ['Build', 'DC 15 simple (2 hours: timer, tripwire trap), 20 moderate (8 hours: lock, engine part), 25 complex (24 hours: phone, engine), 30 advanced (4 days: computer, vehicle)', 'Take \u20135 to finish one time rank faster. Failure wastes the time and materials; more than one degree may cause an accident.'],
                    ['Repair', 'Build DC \u20135', 'Two time ranks faster than building.'],
                    ['Jury-rig', 'Build DC \u201310, standard action', 'Fixes one problem until the end of the scene.'],
                    ['Defeat security', 'DC 10 simple lock, 15 quality, 20 corporate, 25 bank branch or museum, 30 bank headquarters or prison, 35 maximum security, 40 super-prison. +5 to leave no trace', 'At least a minute; GM rolls secretly. More than one degree of failure sets it off.'],
                    ['Place explosives', 'DC 10, at least a minute', '+5 damage to the structure per two full degrees. More than one degree of failure: it goes off while you set it.'],
                    ['Disarm explosives', 'DC 10, or the DC the setter chose', 'Standard action. More than one degree of failure: it goes off.'],
                ] },
            },
            {
                name: 'Treatment',
                text: 'Intellect. Trained Only. Manipulation. Requires Tools (\u20135 without). Treating yourself is \u20135 and limited to diagnosis, care and disease or poison. (p. 129)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Diagnose', 'DC 10, at least a minute', 'May give +2 on further Treatment checks.'],
                    ['Revive', 'DC 15, standard action', 'Removes Dazed or Stunned; other conditions stay.'],
                    ['Stabilize', 'DC 15, standard action', 'A Dying character stops dying.'],
                    ['Long-term care', 'DC 15, a day or more', 'Recovery one time rank faster. Up to your rank in patients at once.'],
                    ['Treat disease or poison', 'DC 15 each time they resist', '+2 on their resistance check; +5 with three or more degrees.'],
                ] },
            },
            {
                name: 'Vehicles',
                text: 'Dexterity. Trained Only. Manipulation. Move action. Riding a mount is Expertise: Riding on Agility, with the same DCs. (p. 129)',
                table: { head: ['Use', 'DC / opposed by', 'Result and notes'], rows: [
                    ['Ordinary driving', 'No check', 'Common vehicles can even be driven untrained.'],
                    ['Maneuver under pressure', 'DC 5 easy (slow turn), 10 average (sudden reverse, dodging obstacles), 15 difficult (tight turns), 20 challenging (bootlegger reverse, loop, barrel roll), 25 formidable (high-speed stunts, jumping obstacles)', 'Roll only in a chase, under attack or against the clock.'],
                ] },
            },
        ],
    },
    {
        title: 'Combat checks',
        entries: [
            {
                name: 'Initiative',
                text: 'd20 + Agility rank, plus modifiers such as Improved Initiative (+4 per rank). Rolled once when the conflict starts; characters act from highest to lowest. Ties go to the higher Dodge, then higher Agility, then higher Awareness, then a die roll. Characters joining later roll when they join. (p. 235)',
            },
            {
                name: 'Surprise round',
                condition: 'Surprised',
                text: 'If anyone is caught off guard, usually by failing a Perception check, the conflict opens with a surprise round. Everyone rolls initiative, but surprised characters do not act and are Stunned and Vulnerable until the next round. Everyone else is limited to a standard action (or a move action) plus free actions. (p. 235)',
            },
            {
                name: 'Attack checks',
                text: 'd20 + attack bonus vs. the target’s defense class, which is the defense + 10: Parry for close attacks, Dodge for ranged attacks. Equal or higher hits. A natural 20 always hits; a natural 1 always misses, whatever the total. Perception-range and Area effects need no attack check and cannot crit or miss. (p. 16, 244)',
            },
            {
                name: 'Critical hits',
                text: [
                    'A natural 20 on an attack check hits automatically and is a threat. It is a critical hit if the check total also equals or beats the target’s defense class; otherwise it is an ordinary hit. Improved Critical widens the threat range (19–20 and so on), but only a natural 20 is an automatic hit.',
                    'The attacker picks one effect for a critical hit. Increased effect: +5 to the resistance DC; against a minion this skips the check and applies the worst degree. Added effect: tack on a second rank-0 effect, such as an Affliction or Weaken, resisted separately. Alternate effect: a free power stunt with the attack, no fatigue. (p. 240)',
                ],
            },
            {
                name: 'Resistance checks',
                text: 'd20 + the relevant defense (usually Dodge, Fortitude, Toughness or Will) vs. the effect’s DC, normally effect rank + 10. Damage is the exception at rank + 15. Ongoing effects are resisted again at the end of each of your turns; a success ends the effect and its conditions. (p. 16, 246)',
                rows: [
                    ['Damage', 'Toughness vs DC 15 + rank'],
                    ['Affliction', 'Fortitude or Will (sometimes Dodge first) vs DC 10 + rank'],
                    ['Weaken', 'Fortitude or Will vs DC 10 + rank'],
                    ['Other effects', 'As the effect says, usually DC 10 + rank'],
                ],
            },
            {
                name: 'Damage results',
                text: 'Each degree of failure on the Toughness check is worse. The –1 penalties are cumulative, so three one-degree failures give –3 on further Toughness checks against damage. A Staggered character who is staggered again takes the fourth-degree result. An Incapacitated character who fails again becomes Dying, and a Dying character who fails again is dead. (p. 241)',
                rows: [
                    ['Success', 'No effect'],
                    ['1 degree', '–1 on further Toughness checks against damage'],
                    ['2 degrees', 'Dazed until the end of your next turn, and –1'],
                    ['3 degrees', 'Staggered, and –1'],
                    ['4 degrees', 'Incapacitated'],
                ],
            },
            {
                name: 'Recovering from damage',
                text: 'With a minute of rest a living character removes one damage condition, worst first: Incapacitated, then Staggered, then Dazed, then one –1 Toughness penalty per minute until fully recovered. Healing and Regeneration speed this up. Objects do not recover; they must be repaired. Lasting injuries are handled as complications. (p. 244)',
            },
            {
                name: 'Vulnerable and Defenseless',
                text: 'Vulnerable halves your active defense ranks, rounding up: Parry 11 and Dodge 9 become 6 and 5. Defenseless sets them to 0, so the defense class is just 10, and attackers may make attack checks against you as routine checks, which means an attack bonus of +0 or better hits automatically. (p. 245)',
            },
            {
                name: 'Minions',
                text: 'Minions cannot score critical hits against non-minions. Non-minions may attack minions with routine checks. A minion that fails any resistance check suffers the worst degree of the effect, so a failed Toughness check leaves it Incapacitated. Some traits, like Takedown, work specially against minions. (p. 245)',
            },
            {
                name: 'Concealment and cover',
                text: [
                    'Concealment means you cannot clearly perceive the target. Partial concealment (dim light, foliage, fog) is a –2 circumstance penalty on your attack check; total concealment (darkness, heavy smoke) is –5, and you must know or guess where to aim.',
                    'Cover is a physical obstruction. Partial cover (about half the target) is –2 and total cover (three-quarters or more) is –5. A target completely behind cover cannot be attacked at all. Cover also gives the same number as a bonus on Dodge checks against area effects coming from the other side of it. (p. 244)',
                ],
            },
            {
                name: 'Attack trade-offs (maneuvers)',
                text: 'Declared before the roll, lasting until the start of your next turn. Each shifts up to 2 points between two values; the matching advantage raises that to 5. Neither value may drop below +0 or more than double. Power Attack and Defensive Attack do not apply to effects with no attack check or no resistance check. (p. 249)',
                rows: [
                    ['Power Attack', '–attack bonus, +effect rank'],
                    ['Accurate Attack', '–effect rank, +attack bonus'],
                    ['All-out Attack', '–Dodge and Parry, +attack bonus'],
                    ['Defensive Attack', '–attack bonus, +Dodge and Parry'],
                ],
            },
            {
                name: 'Demoralize and Feint',
                text: 'Demoralize: a standard action Intimidation check opposed by the better of the target’s Insight or Will defense. Success makes the target Impaired until the end of your next round; four or more degrees makes them Disabled. Feint: a standard action Deception check opposed by the better of the target’s Deception or Insight. Success makes the target Vulnerable against your next attack, until the end of your next round. (p. 249)',
            },
            {
                name: 'Finishing attack',
                text: 'Against a Defenseless target at close range you may attack as a routine check (an automatic hit) or roll normally against DC 10, in which case any hit is a critical hit with +5 to the resistance DC. If you hit with a damaging attack intending to kill and the target fails by three or more degrees, the target dies. (p. 249)',
            },
        ],
    },
    {
        title: 'Afflictions and effects',
        entries: [
            {
                name: 'Affliction',
                text: [
                    'The target resists with Fortitude or Will (chosen when the power is built; some use Dodge for the first check) against DC 10 + rank. The degree of failure sets the condition from the effect’s list. A higher-degree condition replaces a lower one; they do not stack. A plain Affliction is not cumulative: two one-degree results are no worse than one. The Cumulative extra adds them; Progressive raises the degree by one each time a recovery check fails.',
                    'Degree 1 options: Dazed, Entranced, Fatigued, Hindered, Impaired or Vulnerable. Degree 2: Compelled, Defenseless, Disabled, Exhausted, Immobile, Prone or Stunned. Degree 3: Asleep, Controlled, Incapacitated, Paralyzed, Transformed or Unaware. (p. 149)',
                ],
            },
            {
                name: 'Recovering from an affliction',
                text: 'At the end of each of the target’s turns, make a new resistance check against the same DC. Success removes first- and second-degree conditions. Third-degree conditions do not get these checks: they need a minute of recovery time or outside aid such as a Treatment check or a Healing effect against DC 10 + rank. (p. 149)',
            },
            {
                name: 'Weaken',
                text: 'Fortitude or Will vs. DC 10 + rank. On a failure the trait loses power points equal to the difference between the check result and the DC, up to the Weaken rank. Repeated failures stack up to that same maximum. Lost points return at 1 per round at the end of each of the target’s turns. An ability weakened below –5 is Debilitated and cannot be weakened further. Objects do not recover weakened Toughness. (p. 186)',
            },
            {
                name: 'Combined conditions come apart',
                text: 'A combined condition is just its parts, and each part can be removed or superseded on its own. Removing Dazed from a Staggered character leaves them only Hindered. Stunning a Staggered character makes them Stunned and Hindered. If several conditions apply, all of their effects apply. (p. 18)',
            },
        ],
    },
    {
        title: 'Conditions',
        entries: [
            { condition: 'Dazed', name: 'Dazed', text: 'Limited to free actions and a single standard action per turn, which may be used to move. Stunned supersedes Dazed.' },
            { condition: 'Staggered', name: 'Staggered', text: 'Dazed and Hindered.' },
            { condition: 'Incapacitated', name: 'Incapacitated', text: 'Defenseless, Stunned and Unaware. Usually also falls Prone unless something keeps them upright.' },
            { condition: 'Dying', name: 'Dying', text: 'Incapacitated and near death. On gaining the condition make a Fortitude check, DC 15, and again every round: success means nothing happens, two degrees of success stabilises you and removes Dying, and three total degrees of failure across the checks means death. Another character can stabilise you with a Treatment check (DC 15) or a Healing effect.' },
            { condition: 'Stunned', name: 'Stunned', text: 'Cannot take any actions, not even free actions.' },
            { condition: 'Entranced', name: 'Entranced', text: 'Stunned, doing nothing but paying attention to the entrancing effect. Any obvious threat breaks the trance automatically. An ally can also shake you free with an interaction skill check against DC 10 + the effect’s rank.' },
            { condition: 'Surprised', name: 'Surprised', text: 'Stunned and Vulnerable: caught off guard, unable to act and easier to hit. Lasts for the surprise round.' },
            { condition: 'Asleep', name: 'Asleep', text: 'Defenseless, Stunned and Unaware. Woken, with all three removed, by a hearing Perception check with three or more degrees of success, by any sudden movement such as being shaken, or by any effect that allows a resistance check.' },
            { condition: 'Compelled', name: 'Compelled', text: 'Directed by an outside force but struggling against it. Limited to free actions and one standard action per turn, both chosen by the controlling character; the standard action can be traded for a move as usual. Controlled supersedes Compelled.' },
            { condition: 'Controlled', name: 'Controlled', text: 'No free will. Each turn’s actions are dictated by the controlling character.' },
            { condition: 'Vulnerable', name: 'Vulnerable', text: 'Active defenses (Dodge and Parry) are halved, rounding up the final value. Defenseless supersedes Vulnerable.' },
            { condition: 'Defenseless', name: 'Defenseless', text: 'Active defense bonuses are 0, so the defense class is 10. Attackers may attack you as a routine check, or roll normally and treat any hit as a critical hit. Defenseless characters are often also Prone.' },
            { condition: 'Hindered', name: 'Hindered', text: 'Move at half speed, which is –1 speed rank. Immobile supersedes Hindered.' },
            { condition: 'Immobile', name: 'Immobile', text: 'No movement speed and cannot leave the spot you occupy, but you may still take other actions unless another condition prevents it.' },
            { condition: 'Prone', name: 'Prone', text: 'Lying on the ground and Hindered. You take –5 on close attack checks. Opponents get +5 on close attacks against you but –5 on ranged attacks, effectively total cover against ranged attacks. Standing up is a move action.' },
            { condition: 'Restrained', name: 'Restrained', text: 'Hindered and Vulnerable. If the restraints are anchored to something immobile you are Immobile instead of Hindered. If another character is restraining you, you are Immobile but they can move you.' },
            { condition: 'Bound', name: 'Bound', text: 'Defenseless, Immobile and Impaired.' },
            { condition: 'Paralyzed', name: 'Paralyzed', text: 'Defenseless, Immobile and physically Stunned: frozen in place but still aware and able to take purely mental actions that involve no movement at all.' },
            { condition: 'Impaired', name: 'Impaired', text: '–2 circumstance penalty on checks. If it applies only to certain checks they are named, as in Perception Impaired or Attack Impaired. Disabled on the same traits supersedes Impaired.' },
            { condition: 'Disabled', name: 'Disabled', text: '–5 circumstance penalty on checks. If it applies only to certain checks they are named, as in Fighting Disabled. Debilitated on the same traits supersedes Disabled.' },
            {
                condition: 'Debilitated', name: 'Debilitated',
                text: 'One or more ability ranks have dropped below –5. The effect depends on the ability, and abilities cannot be lowered any further once debilitated. Debilitated supersedes Weakened.',
                rows: [
                    ['STR, AGL or DEX', 'the hero collapses: Defenseless, Immobile and Stunned, though still conscious and aware'],
                    ['STA', 'Dying, with a further –5 on Fortitude checks to avoid death'],
                    ['FGT', 'Dazed and Defenseless, and cannot make close attacks'],
                    ['INT, AWE or PRE', 'Unaware until restored to at least –5'],
                ],
            },
            { condition: 'Fatigued', name: 'Fatigued', text: 'Hindered. Recovers after an hour of rest. Becoming Fatigued again makes you Exhausted.' },
            { condition: 'Exhausted', name: 'Exhausted', text: 'Near collapse: Impaired and Hindered. Recovers after an hour of rest in comfortable surroundings. Becoming Exhausted again makes you Incapacitated.' },
            { condition: 'Weakened', name: 'Weakened', text: 'A trait has temporarily lost power points to a Weaken effect; use the reduced rank for everything it affects. Lost points return at 1 per round. Debilitated supersedes Weakened.' },
            { condition: 'Unaware', name: 'Unaware', text: 'Completely unaware of your surroundings: no interaction or Perception checks and no actions based on them. If only certain senses are affected they are named, as in visually Unaware or tactilely Unaware (numb). Everything has full concealment from your unaware senses.' },
            { condition: 'Blind', name: 'Blind', text: 'Cannot see, so everything has full visual concealment from you. Hindered, visually Unaware and Vulnerable, and possibly Impaired or Disabled for tasks where vision matters.' },
            { condition: 'Deaf', name: 'Deaf', text: 'Cannot hear, so everything has total auditory concealment from you, which can allow surprise attacks on you. Interaction is limited to sign language and lip-reading.' },
            { condition: 'Transformed', name: 'Transformed', text: 'Some or all of your traits are altered by an outside agency, from a change of appearance to new trait ranks or the loss and gain of whole traits. Your power point total cannot go up while transformed, though it can effectively go down, as when a hero is turned into a frog.' },
        ],
    },
];
