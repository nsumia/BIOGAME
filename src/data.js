// All game content: scientists, species (with verified facts), missions, dialogue and quizzes.
export const PLAYER_LOOK = { skin: 'f1', hair: 'h1', hairStyle: 'short', top: 'b2', topS: 'b1', pants: 'n1', hat: 'o1', hatS: 'r1' };
export const NPCS = {
  wren: { name: 'Dr. Odalys Wren', role: 'Reserve Director, ecologist', bg: 'g2', at: 'wren', face: 'd', look: { skin: 'f2', hair: 'n3', hairStyle: 'bun', top: 'g2', topS: 'g1', pants: 'd1', glasses: true } },
  quill: { name: 'Prof. Tobias Quill', role: 'Entomologist (insects)', bg: 'y1', at: 'quill', face: 'd', look: { skin: 'f1', hair: 'n2', hairStyle: 'bald', beard: true, top: 'y1', topS: 'o1', pants: 'd2', hat: 's1', hatS: 's2' } },
  sato: { name: 'Dr. Mireille Sato', role: 'Botanist (plants and fungi)', bg: 'p1', at: 'sato', face: 'd', look: { skin: 'f2', hair: 'k', hairStyle: 'long', top: 'p2', topS: 'p1', pants: 'g1', boots: 'g1' } },
  adeyemi: { name: 'Dr. Kofi Adeyemi', role: 'Zoologist (mammals)', bg: 'd2', at: 'adeyemi', face: 'd', look: { skin: 'f3', hair: 'k', hairStyle: 'curly', top: 'd2', topS: 'd1', pants: 'n1', hat: 'g2', hatS: 'g1' } },
  marsh: { name: 'Dr. Lena Marsh', role: 'Freshwater biologist', bg: 'b2', at: 'marsh', face: 'l', look: { skin: 'f1', hair: 'o1', hairStyle: 'short', top: 'b3', topS: 'b2', pants: 'g1', boots: 'g1', glasses: true } },
  raman: { name: 'Dr. Priya Raman', role: 'Ornithologist (birds)', bg: 'r1', at: 'raman', face: 'd', look: { skin: 'f2', hair: 'h1', hairStyle: 'bun', top: 'r2', topS: 'r1', pants: 'n2' } },
  costa: { name: 'Dr. Rafael Costa', role: 'Marine biologist', bg: 'b3', at: 'costa', face: 'd', look: { skin: 'f2', hair: 'y1', hairStyle: 'short', top: 'o1', topS: 'r1', pants: 'b1', boots: 'b1' } },
};
export const SPEAKERS = { ...Object.fromEntries(Object.entries(NPCS).map(([k, v]) => [k, { name: v.name, look: v.look, bg: v.bg }])), me: { name: 'You', look: PLAYER_LOOK, bg: 'b2' } };

// sprite = key in sprite registry used for journal icon
export const SPECIES = {
  painted_lady: { name: 'Painted Lady', latin: 'Vanessa cardui', group: 'Insect', sprite: 'butterfly_painted', fact: 'Painted ladies migrate thousands of kilometres each year, over several generations of butterflies.' },
  common_blue: { name: 'Common Blue', latin: 'Polyommatus icarus', group: 'Insect', sprite: 'butterfly_blue', fact: 'Only male Common Blues are bright blue. The females are mostly brown.' },
  brimstone: { name: 'Brimstone', latin: 'Gonepteryx rhamni', group: 'Insect', sprite: 'butterfly_brimstone', fact: 'Brimstones hibernate as adults and can live almost a year, very long for a butterfly.' },
  ladybird: { name: 'Seven-spot Ladybird', latin: 'Coccinella septempunctata', group: 'Insect', sprite: 'ladybird', fact: 'Its bright red colour warns predators that it tastes bad. This is called warning colouration.' },
  bumblebee: { name: 'Buff-tailed Bumblebee', latin: 'Bombus terrestris', group: 'Insect', sprite: 'bee', fact: 'Bumblebees shake pollen loose by vibrating their flight muscles against a flower. It is called buzz pollination.' },
  dragonfly: { name: 'Emperor Dragonfly', latin: 'Anax imperator', group: 'Insect', sprite: 'dragonfly', fact: 'Young dragonflies, called nymphs, live underwater and hunt there before they climb out and fly.' },
  mayfly: { name: 'Mayfly nymph', latin: 'Ephemeroptera', group: 'Insect', sprite: 'mayfly', fact: 'Mayfly nymphs need clean, oxygen-rich water, so finding them shows a healthy stream or pond.' },
  firefly: { name: 'Firefly', latin: 'Lampyridae', group: 'Insect', sprite: 'firefly', fact: 'Fireflies make cold light: luciferin, an enzyme called luciferase, and oxygen react and give off almost no heat.' },
  oak: { name: 'English Oak', latin: 'Quercus robur', group: 'Plant', sprite: 'oakleaf', fact: 'One oak tree can support over 2,000 species of insects, fungi and other life.' },
  bracken: { name: 'Bracken fern', latin: 'Pteridium aquilinum', group: 'Plant', sprite: 'fern', fact: 'Ferns have no flowers or seeds. They reproduce with tiny spores.' },
  fly_agaric: { name: 'Fly Agaric', latin: 'Amanita muscaria', group: 'Fungus', sprite: 'mushroom', fact: 'Fungi are not plants. They absorb food, and their thread network (mycelium) spreads unseen underground. This one is poisonous.' },
  roe_deer: { name: 'Roe Deer', latin: 'Capreolus capreolus', group: 'Mammal', sprite: 'deer_alert', fact: 'Deer are prey animals. Eyes on the sides of the head give them a huge field of view to spot danger.' },
  red_fox: { name: 'Red Fox', latin: 'Vulpes vulpes', group: 'Mammal', sprite: 'fox_sit', fact: 'Foxes are omnivores. Their tracks show four toes and claw marks, like a dog\'s.' },
  otter: { name: 'Eurasian Otter', latin: 'Lutra lutra', group: 'Mammal', sprite: 'otter_walk', fact: 'Otters sit at the top of the river food chain, and thrive only where the water is clean and full of fish.' },
  robin: { name: 'European Robin', latin: 'Erithacus rubecula', group: 'Bird', sprite: 'robin_idle', fact: 'Robins defend their territory fiercely, and the red breast is part of their threat display.' },
  goldfinch: { name: 'Goldfinch', latin: 'Carduelis carduelis', group: 'Bird', sprite: 'bird_goldfinch', fact: 'A slim, pointed beak is perfect for picking small seeds out of thistles and teasels.' },
  sparrowhawk: { name: 'Eurasian Sparrowhawk', latin: 'Accipiter nisus', group: 'Bird', sprite: 'bird_sparrowhawk', fact: 'A hooked beak tears meat, and forward-facing eyes judge distance when it hunts small birds.' },
  blue_tit: { name: 'Blue Tit', latin: 'Cyanistes caeruleus', group: 'Bird', sprite: 'tit', fact: 'Blue tits time their nesting so the chicks hatch when caterpillars, their main food, are most plentiful.' },
  grey_heron: { name: 'Grey Heron', latin: 'Ardea cinerea', group: 'Bird', sprite: 'heron_idle', fact: 'A heron stands still, then spears fish with its long dagger-shaped bill.' },
  frog: { name: 'Common Frog', latin: 'Rana temporaria', group: 'Amphibian', sprite: 'frog_idle', fact: 'Frogs breathe partly through their skin, so they need clean, damp places to live.' },
  trout: { name: 'Brown Trout', latin: 'Salmo trutta', group: 'Fish', sprite: 'fish', fact: 'Brown trout need cool, well-oxygenated water. They are another sign of a clean river.' },
  shore_crab: { name: 'Shore Crab', latin: 'Carcinus maenas', group: 'Crustacean', sprite: 'crab', fact: 'A crab\'s shell is a rigid skeleton on the outside. To grow, the crab sheds it, called moulting.' },
  starfish: { name: 'Common Starfish', latin: 'Asterias rubens', group: 'Echinoderm', sprite: 'starfish_o', fact: 'Sea stars crawl on hundreds of tiny tube feet, and can regrow lost arms.' },
  anemone: { name: 'Beadlet Anemone', latin: 'Actinia equina', group: 'Cnidarian', sprite: 'anemone', fact: 'When the tide goes out, it pulls in its tentacles to keep from drying out. Its tentacles sting with tiny harpoon cells.' },
  loggerhead: { name: 'Loggerhead Turtle', latin: 'Caretta caretta', group: 'Reptile', sprite: 'hatchling', fact: 'Hatchlings crawl toward the brightest horizon, normally the sea. Artificial lights can lead them astray.' },
};

export const QUIZZES = {
  legs: [{ q: 'How many legs does an insect have, and in how many body parts?', opts: ['Six legs, three body parts', 'Eight legs, two body parts', 'Four legs, three body parts'], a: 0, hint: 'Think head, thorax, abdomen. Spiders have eight legs, so they are not insects.', fact: 'Insects have six legs and three body parts: head, thorax and abdomen.' }],
  green: [
    { q: 'Which of your three samples is NOT a plant?', opts: ['The oak leaf', 'The bracken fern', 'The fly agaric mushroom'], a: 2, hint: 'It has no leaves and no chlorophyll. It absorbs its food instead.', fact: 'Fungi form their own group, separate from plants and animals.' },
    { q: 'In photosynthesis, leaves use sunlight, water and carbon dioxide. What gas do they release?', opts: ['Nitrogen', 'Oxygen', 'Methane'], a: 1, hint: 'It is the gas we breathe in.', fact: 'Photosynthesis makes sugar for the plant and releases oxygen.' },
  ],
  eyes: [{ q: 'Why do deer have eyes on the sides of their heads?', opts: ['To see predators coming from almost any direction', 'To see well in the dark only', 'To judge distance when hunting'], a: 0, hint: 'Deer are the hunted, not the hunters.', fact: 'Side-set eyes give prey animals a very wide field of view.' }],
  claws: [{ q: 'The prints show four toes WITH claw marks. Which animal family made them?', opts: ['A cat (cats keep claws hidden)', 'A dog-like canid, such as a fox', 'A bird'], a: 1, hint: 'Cats pull their claws in when walking, so cat prints show no claws.', fact: 'Canids, the dog family, cannot retract their claws, so claws show in their tracks.' }],
  mayfly: [{ q: 'We found many mayfly nymphs. What does that tell us about the water?', opts: ['It is polluted', 'It is clean and rich in oxygen', 'It is salty'], a: 1, hint: 'Mayfly nymphs are fussy. They cannot live in oxygen-poor water.', fact: 'An indicator species shows the condition of its habitat.' }],
  clutch: [{ q: 'Why do many songbirds wait until the last egg is laid before sitting on the nest?', opts: ['So all the chicks hatch at about the same time', 'To keep the eggs cool', 'Eggs need no warmth'], a: 0, hint: 'Think about parents who must feed a whole nest of hungry chicks.', fact: 'Starting incubation together makes the chicks hatch almost together.' }],
  beak_seed: [{ q: 'Look at the beak: short, slim and pointed. What does this bird eat?', opts: ['Small seeds', 'Fish', 'Large mammals'], a: 0, hint: 'Thistle and teasel seeds are small and need delicate picking.', fact: 'Beak shape matches diet.' }],
  beak_meat: [{ q: 'A hooked beak and forward-facing eyes. What does this bird eat?', opts: ['Nectar', 'Small birds and mammals', 'Seeds'], a: 1, hint: 'Hooks tear flesh, and forward eyes judge the distance to prey.', fact: 'Birds of prey have hooked beaks for tearing meat.' }],
  beak_fish: [{ q: 'A very long, sharp, dagger-like bill. What does this bird eat?', opts: ['Fish and frogs', 'Berries', 'Insects in the bark'], a: 0, hint: 'It stands in shallow water and strikes quickly.', fact: 'A spear-shaped bill is made for catching fish.' }],
  tide: [{ q: 'What mainly causes the ocean tides?', opts: ['Wind blowing over the sea', 'The Moon\'s gravity (and a little from the Sun)', 'Underwater volcanoes'], a: 1, hint: 'Something in the night sky pulls on the water.', fact: 'Tides are caused mostly by the Moon\'s gravity pulling on the oceans.' }],
  light: [{ q: 'Why do turtle hatchlings crawl toward the sea?', opts: ['They smell salt', 'They head for the brightest horizon', 'They follow the wind'], a: 1, hint: 'Lights from buildings can lead them the wrong way.', fact: 'Hatchlings orient to the brightest horizon, normally the sea reflecting the sky.' }],
  otter: [{ q: 'Why is a healthy otter population good news?', opts: ['Otters clean the water by themselves', 'It shows the whole river food web is healthy', 'Otters scare off fish'], a: 1, hint: 'A top predator needs lots of fish, and fish need clean water.', fact: 'Top predators are good signs of a healthy ecosystem.' }],
};

// Dialogue: [speaker, text, mood]. mood: n happy wow think
export const DIALOGUE = {
  m1_a: [
    ['wren', 'Welcome to Lanternfen Reserve! You must be our new field intern. I am Dr. Wren, the director.', 'happy'],
    ['wren', 'A reserve is a protected place where many species and their habitat work together. We call that an ecosystem.', 'n'],
    ['wren', 'My team needs help with a string of surveys. Move with WASD or arrow keys. Hold Shift to run, but remember, wild animals hate noise.', 'n'],
    ['wren', 'Walk over to that sign and press E to read it. Then come back and I will hand you your field kit.', 'happy'],
  ],
  m1_sign: ['Lanternfen Reserve.  North: Wildflower Meadow.  West across the river: Hushwood Forest and Reedmere Wetland.  East: Foxhollow Wood.  South: Saltglass Beach.  Please keep to the paths, and take only photographs.'],
  m1_b: [
    ['wren', 'Good. Reading signs is half of fieldwork. Here is your kit: net, camera, magnifying lens and sample jar.', 'happy'],
    ['wren', 'Your notes go in the Field Journal. Press J to open it. Every species you find is saved there with a fact.', 'n'],
    ['wren', 'Start with Professor Quill in the Wildflower Meadow, to the north. Follow the arrow at the top of the screen.', 'happy'],
    ['me', 'Net, camera, lens, jar. Let us go!', 'happy'],
  ],
  m2_a: [
    ['quill', 'Ah, the intern! Splendid. Look at this meadow, buzzing with life. Insects are the most numerous animals on Earth.', 'happy'],
    ['quill', 'I need four specimens for my survey. Press E to swing your net. Butterflies are flighty, so get close and be quick.', 'n'],
    ['quill', 'Do not worry, we always release them afterwards. Off you go. Net four insects!', 'happy'],
  ],
  m2_b: [
    ['quill', 'Marvellous! Four insects, noted and released. Even the bumblebee, a pollinator we must protect, was returned in one piece.', 'happy'],
    ['quill', 'Now a pop quiz, for science.', 'think'],
  ],
  m2_c: [
    ['quill', 'Correct! Next time you meet a spider, remember that it is no insect at all. The meadow thanks you.', 'happy'],
    ['quill', 'Dr. Sato in Hushwood Forest, west over the river, needs hands. She grows more excited about leaves than anyone I know.', 'n'],
  ],
  m3_a: [
    ['sato', 'You are the intern? Wonderful. Forests are the lungs of the land, and this one has plenty to teach.', 'happy'],
    ['sato', 'I need three samples: an oak leaf, a bracken frond and one more oddity. Use your lens, press E near the sparkles.', 'n'],
    ['sato', 'Look near the forest floor. Do not touch anything red and spotty. Scan it only.', 'think'],
  ],
  m3_b: [
    ['sato', 'Oak, bracken and a fly agaric. Beautiful and a little dangerous, that last one. Time to test your knowledge.', 'happy'],
  ],
  m3_c: [
    ['sato', 'Spot on! Leaves are solar panels. Oak trees feed whole communities, and fungi under the soil trade with their roots.', 'happy'],
    ['sato', 'Dr. Adeyemi is in the forest clearing right behind me. He is tracking a deer, and needs someone quiet.', 'n'],
  ],
  m4_a: [
    ['adeyemi', 'Shh! Speak softly. Deer are shy. I want a photograph of the roe deer in that clearing for our population count.', 'think'],
    ['adeyemi', 'Walk, never run, and do not rush right up to it. Get within a few steps, then press E to take the shot.', 'n'],
    ['adeyemi', 'If it lifts its head and bounds off, give it a minute. It will come back to graze.', 'happy'],
  ],
  m4_b: [
    ['adeyemi', 'Look at that photograph! Perfect. See how its ears turn like radar dishes?', 'happy'],
  ],
  m4_c: [
    ['adeyemi', 'Exactly. Prey animals trade sharp depth perception for a panoramic view. Predators have it the other way around.', 'happy'],
    ['adeyemi', 'One more favour. Someone has been leaving tracks near Foxhollow Wood to the east. I will guide you by radio.', 'n'],
  ],
  m5_a: [
    ['adeyemi', 'Kofi to intern. Radio check. Head east along the path to Foxhollow Wood. You should see fresh paw prints.', 'n'],
    ['adeyemi', 'Follow the trail, print by print. Use E to examine each one. Go slowly.', 'think'],
  ],
  m5_end: [
    ['me', 'Dr. Adeyemi... there is a den. And something small just poked its nose out.', 'wow'],
    ['adeyemi', 'Foxes! A vixen with her kits, I would bet. Do not get closer. They are born in spring and stay near the den.', 'happy'],
    ['adeyemi', 'Now, look at that print again, the one you examined.', 'think'],
  ],
  m5_done: [
    ['adeyemi', 'Right on. You have helped protect a family of foxes by reporting the den. Nice work, intern.', 'happy'],
    ['adeyemi', 'Dr. Marsh at Reedmere pond needs water samples. She is the best freshwater biologist I know. Go meet her.', 'n'],
  ],
  m6_a: [
    ['marsh', 'Hello, intern! Ponds and rivers are my world. Clean water is the foundation of everything downstream.', 'happy'],
    ['marsh', 'Take three samples with your jar: one at the end of the pier, one on the north shore, one at the river bank near the bench.', 'n'],
    ['marsh', 'Stand near the rippling water and press E. Keep your boots dry, if you can.', 'happy'],
  ],
  m6_frog: [['me', 'Whoa! A frog just jumped out of the reeds and nearly landed on my boot!', 'wow']],
  m6_b: [
    ['marsh', 'Let us see. Under the microscope... mayfly nymphs! Dozens of them, plus damselfly larvae. Lovely.', 'happy'],
  ],
  m6_c: [
    ['marsh', 'Exactly. Clean water, rich in oxygen. A healthy pond also means healthy frogs, and the brown trout upstream.', 'happy'],
    ['marsh', 'If you want birds, Dr. Raman is at the hide just south of here. Bring your best eyes and your quietest steps.', 'n'],
  ],
  m7_a: [
    ['raman', 'Welcome to the hide, intern! Birdwatching is mostly patience, and a lot of tea.', 'happy'],
    ['raman', 'Birds tell us what they eat through their beaks. Step to the hide door and press E to start watching.', 'n'],
    ['raman', 'I will show you silhouettes, you tell me who is flying by and how they live.', 'happy'],
  ],
  m7_watch: [['raman', 'Quick, here comes one! Study the beak.', 'wow']],
  m7_b: [
    ['raman', 'Three birds, three beaks, three lifestyles. Evolution has shaped each one for a different meal.', 'happy'],
    ['raman', 'Hold on, before you leave. I have one more small job, if you do not mind.', 'think'],
  ],
  n_a: [
    ['raman', 'We keep nest boxes around the reserve, and each one needs a quick check for my season survey.', 'n'],
    ['raman', 'Visit three: one at the forest edge, one at the meadow fence, one by the east path. Scan them with your lens, quietly, and never touch the nest.', 'think'],
    ['raman', 'Most songbirds lay one egg a day, but only start sitting on them once the clutch is complete. Remember that for later.', 'happy'],
  ],
  n_b: [
    ['raman', 'Two boxes with eggs and one empty, which is perfectly normal. Thank you, the survey is much more accurate now.', 'happy'],
  ],
  n_c: [
    ['raman', 'Right! Every chick hatches within a day of the others, so the parents can feed them all at once.', 'happy'],
    ['raman', 'Now go south-east to the beach. Dr. Costa is at the tidepools. Tell him I said hello.', 'n'],
  ],
  m8_a: [
    ['costa', 'Ahoy, intern! Saltglass Beach, the edge of the sea, is a tough home. Twice a day the tide goes out and leaves the animals stranded.', 'happy'],
    ['costa', 'In the tidepools to the east, look for three creatures. Use your lens, press E at the sparkles by the rock pools.', 'n'],
    ['costa', 'Watch your step on the rocks. Or the rocks will watch your step.', 'happy'],
  ],
  m8_b: [
    ['costa', 'A crab, a starfish and an anemone, all squeezed into a puddle! Tidepool life is tough: they handle heat, salt and waves.', 'happy'],
  ],
  m8_c: [
    ['costa', 'Right. The Moon pulls the ocean towards it twice a day. That is why beaches have two high tides every day.', 'happy'],
    ['costa', 'Hold on... did you hear that? Peeping. Over by the old boat!', 'wow'],
  ],
  m9_a: [
    ['costa', 'A loggerhead hatchling! A straggler. They usually emerge at night, and head for the sea. This one is lost in the daylight.', 'wow'],
    ['costa', 'Walk slowly and it will follow you. Lead it down to the waterline, the sand at the edge of the sea.', 'n'],
    ['costa', 'Do not carry it, and do not run. Let it come at its own pace.', 'happy'],
  ],
  m9_b: [
    ['me', 'There you go, little one. Swim safe!', 'happy'],
    ['costa', 'It made it. Only about one in a thousand sea turtle hatchlings will survive to adulthood, so that was a big moment.', 'happy'],
  ],
  m9_c: [
    ['costa', 'Hatchlings crawl toward the brightest horizon, which is normally the open sea. What would confuse them on a beach?', 'think'],
  ],
  m9_d: [
    ['costa', 'Exactly. That is why some beaches switch off their lights during nesting season. Dr. Wren is calling you back, I think.', 'happy'],
  ],
  m10_a: [
    ['wren', 'There you are! The team tells me you have been outstanding. Six surveys, a new fox den and a rescued hatchling.', 'happy'],
    ['wren', 'One last thing. There is a rumour of an otter on the Lantern River. Nobody has seen one here for years.', 'wow'],
    ['wren', 'Otters are shy and active at dusk. Wait on the bench on the east bank, then sneak along the shore with your camera.', 'think'],
  ],
  m10_rest: ['The sun slides toward the hills. Birds fall quiet, and the meadow glows gold. Soon the first fireflies come out, one by one.'],
  m10_b: [
    ['me', 'There! In the water, a sleek head, whiskers... It is an otter!', 'wow'],
  ],
  m10_c: [
    ['wren', 'An otter on Lantern River! Do you know what that means?', 'happy'],
  ],
  m10_d: [
    ['wren', 'Exactly. You, intern, have helped us prove this reserve is thriving. Let me call the team.', 'happy'],
    ['quill', 'Whoo-hoo! Specimens and spotted otters, all in one summer!', 'happy'],
    ['sato', 'The forest sends its thanks, and so do I.', 'happy'],
    ['adeyemi', 'Foxes safe, deer happy, intern promoted.', 'happy'],
    ['marsh', 'Clean water, happy otter. This is why we do the work.', 'happy'],
    ['raman', 'Three beaks, one brilliant intern.', 'happy'],
    ['costa', 'And one very lucky turtle!', 'happy'],
    ['wren', 'Welcome to the team, Field Scientist. Open your journal, there is plenty left to discover.', 'happy'],
  ],
};

// radio flag for dialogue key list
export const RADIO = new Set(['m5_a', 'm5_end', 'm5_done']);

export const MISSIONS = [
  { id: 'm1', title: 'Welcome to Lanternfen', giver: 'wren', lesson: 'Ecosystem: living things and their habitat interact as one system.', steps: [
    { t: 'talk', npc: 'wren', lines: 'm1_a', hud: 'Talk to Dr. Wren at the Field Station' },
    { t: 'read', sign: 'station', lines: 'm1_sign', hud: 'Read the sign (press E next to it)' },
    { t: 'talk', npc: 'wren', lines: 'm1_b', hud: 'Report back to Dr. Wren', give: 'kit' },
  ] },
  { id: 'm2', title: 'Meadow Specimens', giver: 'quill', lesson: 'Insects have six legs and three body parts: head, thorax, abdomen.', steps: [
    { t: 'talk', npc: 'quill', lines: 'm2_a', hud: 'Find Prof. Quill in the Wildflower Meadow' },
    { t: 'catch', n: 4, tool: 'net', hud: 'Net insects with E', spawn: 'meadow' },
    { t: 'talk', npc: 'quill', lines: 'm2_b', quiz: 'legs', after: 'm2_c', hud: 'Return to Prof. Quill' },
  ] },
  { id: 'm3', title: 'Leaf, Frond, Fungus', giver: 'sato', lesson: 'Photosynthesis: leaves turn sunlight, water and CO2 into sugar and oxygen. Fungi are not plants.', steps: [
    { t: 'talk', npc: 'sato', lines: 'm3_a', hud: 'Find Dr. Sato at the edge of Hushwood Forest' },
    { t: 'collect', tool: 'lens', hud: 'Scan 3 samples in the forest (E at sparkles)', items: [
      { id: 'oak_leaf', at: 'leaf', spr: 'leafpile', sp: 'oak', label: 'Oak leaf' }, { id: 'fern', at: 'fern', spr: 'fern', sp: 'bracken', label: 'Bracken frond' }, { id: 'agaric', at: 'mushroom', spr: 'mushroom', sp: 'fly_agaric', label: 'Fly agaric' }] },
    { t: 'talk', npc: 'sato', lines: 'm3_b', quiz: 'green', after: 'm3_c', hud: 'Return to Dr. Sato' },
  ] },
  { id: 'm4', title: 'The Shy Deer', giver: 'adeyemi', lesson: 'Prey animals have side-set eyes and a wide field of view. Approach wildlife quietly.', steps: [
    { t: 'talk', npc: 'adeyemi', lines: 'm4_a', hud: 'Talk to Dr. Adeyemi' },
    { t: 'photo', target: 'deer', hud: 'Photograph the roe deer: walk, do not run (E)' },
    { t: 'talk', npc: 'adeyemi', lines: 'm4_b', quiz: 'eyes', after: 'm4_c', hud: 'Show Dr. Adeyemi the photo' },
  ] },
  { id: 'm5', title: 'Fox Tracks', giver: 'adeyemi', lesson: 'Canids (dogs, foxes) cannot retract claws, so claw marks show in their tracks.', steps: [
    { t: 'cutscene', lines: 'm5_a', hud: 'Listen to the radio' },
    { t: 'trail', pts: ['t1', 't2', 't3', 't4', 't5'], hud: 'Follow the paw prints in Foxhollow Wood (E)' },
    { t: 'cutscene', lines: 'm5_end', quiz: 'claws', after: 'm5_done', hud: 'Radio Dr. Adeyemi' },
  ] },
  { id: 'm6', title: 'Pond Detective', giver: 'marsh', lesson: 'Indicator species such as mayfly nymphs show water quality.', steps: [
    { t: 'talk', npc: 'marsh', lines: 'm6_a', hud: 'Meet Dr. Marsh at Reedmere pond' },
    { t: 'collect', tool: 'jar', hud: 'Fill 3 sample jars at the rippling water (E)', items: [
      { id: 'w1', at: 'waterA', spr: 'ripple', sp: 'mayfly', label: 'Pier sample', water: true }, { id: 'w2', at: 'waterB', spr: 'ripple', sp: 'frog', label: 'North shore sample', water: true, event: 'frog' }, { id: 'w3', at: 'waterC', spr: 'ripple', sp: 'trout', label: 'River sample', water: true }] },
    { t: 'talk', npc: 'marsh', lines: 'm6_b', quiz: 'mayfly', after: 'm6_c', hud: 'Bring samples to Dr. Marsh' },
  ] },
  { id: 'm7', title: 'Beaks and Feathers', giver: 'raman', lesson: 'Beak shape matches diet: seeds, fish, meat.', steps: [
    { t: 'talk', npc: 'raman', lines: 'm7_a', hud: 'Find Dr. Raman at the bird hide' },
    { t: 'watch', at: 'hidedoor', hud: 'Watch from the hide (E at the door)', rounds: [
      { bird: 'goldfinch', quiz: 'beak_seed', sp: 'goldfinch' }, { bird: 'sparrowhawk', quiz: 'beak_meat', sp: 'sparrowhawk' }, { bird: 'heron', quiz: 'beak_fish', sp: 'grey_heron' }] },
    { t: 'talk', npc: 'raman', lines: 'm7_b', hud: 'Tell Dr. Raman what you saw' },
  ] },
  { id: 'm7n', title: 'Nest Box Round', giver: 'raman', lesson: 'Birds start incubating once the clutch is complete, so chicks hatch together.', steps: [
    { t: 'talk', npc: 'raman', lines: 'n_a', hud: 'Talk to Dr. Raman again' },
    { t: 'collect', tool: 'lens', hud: 'Check 3 nest boxes: forest edge, meadow fence, east path', items: [
      { id: 'nb1', at: 'nb1', spr: 'nestbox', sp: 'robin', label: 'Forest nest box' }, { id: 'nb2', at: 'nb2', spr: 'nestbox', sp: 'blue_tit', label: 'Meadow nest box' }, { id: 'nb3', at: 'nb3', spr: 'nestbox', sp: null, label: 'East path nest box' }] },
    { t: 'talk', npc: 'raman', lines: 'n_b', quiz: 'clutch', after: 'n_c', hud: 'Report back to Dr. Raman' },
  ] },
  { id: 'm8', title: 'Life in the Tidepool', giver: 'costa', lesson: 'Tides come from the Moon\'s gravity. Shore animals survive drying and waves.', steps: [
    { t: 'talk', npc: 'costa', lines: 'm8_a', hud: 'Meet Dr. Costa on Saltglass Beach' },
    { t: 'collect', tool: 'lens', hud: 'Scan the 3 tidepool critters (E at sparkles)', items: [
      { id: 'p1', at: 'pool1', spr: 'sparkle', sp: 'shore_crab', label: 'Shore crab' }, { id: 'p2', at: 'pool2', spr: 'sparkle', sp: 'starfish', label: 'Starfish' }, { id: 'p3', at: 'pool3', spr: 'sparkle', sp: 'anemone', label: 'Anemone' }] },
    { t: 'talk', npc: 'costa', lines: 'm8_b', quiz: 'tide', after: 'm8_c', hud: 'Report to Dr. Costa' },
  ] },
  { id: 'm9', title: 'Hatchling Rescue', giver: 'costa', lesson: 'Sea turtle hatchlings steer toward the brightest horizon: lights confuse them.', steps: [
    { t: 'talk', npc: 'costa', lines: 'm9_a', hud: 'Listen to Dr. Costa' },
    { t: 'carry', to: 'sea', hud: 'Lead the hatchling to the sea (walk slowly)', arrive: 'm9_b' },
    { t: 'cutscene', lines: 'm9_c', quiz: 'light', after: 'm9_d', hud: 'Talk to Dr. Costa' },
  ] },
  { id: 'm10', title: 'Otter at Dusk', giver: 'wren', lesson: 'Top predators like otters indicate a healthy ecosystem.', steps: [
    { t: 'talk', npc: 'wren', lines: 'm10_a', hud: 'Return to Dr. Wren at the Field Station' },
    { t: 'rest', at: 'bench', until: 18.5, lines: 'm10_rest', hud: 'Rest on the east-bank bench until dusk (E)' },
    { t: 'photo', target: 'otter', lines: 'm10_b', hud: 'Sneak along the river and photograph the otter (E)' },
    { t: 'cutscene', lines: 'm10_c', quiz: 'otter', after: 'm10_d', hud: 'Show Dr. Wren' },
  ] },
];
export const CHAT = {
  wren: ['Remember: take only photographs, leave only footprints.', 'The reserve has about forty species of butterflies and moths. Keep your net handy.', 'A healthy ecosystem is like a web. Pull one thread and the whole web moves.'],
  quill: ['A butterfly smells with its antennae and tastes with its feet. Remarkable, no?', 'Beetles are the most species-rich group of animals on Earth. Ladybirds are only one small branch.', 'Bumblebees keep warm by shivering their flight muscles. Rather like me on a cold morning.'],
  sato: ['Oaks drop acorns, and jays bury them. Jays plant more forests than any gardener.', 'The roots and fungi below us swap sugar for minerals. A hidden marketplace.', 'Ferns are older than dinosaurs. They have been growing spores for over 300 million years.'],
  adeyemi: ['Quiet feet beat fast feet, every time.', 'Roe deer fawns hide in long grass and stay very still. Their spots are camouflage.', 'Foxes use the same path every night. Look for flattened grass.'],
  marsh: ['Dragonfly nymphs are fierce hunters. Underwater, they shoot out a hinged jaw to catch prey.', 'Dissolved oxygen is the secret of every river. Fast, splashing water holds more.', 'Pond skaters walk on the surface film. Water has a surprisingly strong skin.'],
  raman: ['Robins are bold in autumn: they follow gardeners hoping for worms.', 'A heron can stand still for an hour. Patience pays, in fish.', 'A bird\'s hollow bones make it light. Every gram counts when you fly.'],
  costa: ['Starfish have no brain, but they can sense light with eyespots on their arm tips.', 'The tide tables are my bible. Two highs, two lows, every day.', 'A shore crab\'s favourite hiding place is under a rock. Do not forget to put the rocks back.'],
};
export const START_HOUR = 8, DAY_SECONDS_PER_HOUR = 66;
