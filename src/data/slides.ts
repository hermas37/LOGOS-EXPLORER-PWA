export interface Slide {
  id: number;
  title: string;
  subtitle: string;
  visualLayout: {
    icon: string;
    description: string;
    accentColor: string;
  };
  bullets: string[];
  speakerNotes: string;
}

export const EPISODE_SLIDES: Record<string, Slide[]> = {
  "episode-1": [
    {
      "id": 1,
      "title": "Two Vantage Points",
      "subtitle": "Eternity vs. Linear Time",
      "visualLayout": {
        "icon": "Compass",
        "description": "A sketch of a high, sunlit peak looking down on a winding path passing through a deep, foggy valley.",
        "accentColor": "border-amber-500/30 text-amber-500 bg-amber-500/5"
      },
      "bullets": [
        "The Road (Chronos): Step-by-step linear progression through moments.",
        "The Mountain (Kairos): Simultaneous presence of past, present, and future.",
        "Crucial Insight: Divine foreknowledge does not cause human actions anymore than seeing a traveler forces his footsteps."
      ],
      "speakerNotes": "Begin by establishing the two views. Boethius used this to answer philosophy's greatest question: how can God know what I will do if I am free? He doesn't know 'in advance' from our timeline; He knows from His timeless 'now'."
    },
    {
      "id": 2,
      "title": "The Block Universe Enigma",
      "subtitle": "Is Time's Flow a Pure Illusion?",
      "visualLayout": {
        "icon": "Grid",
        "description": "A 4D crystal cube showing frozen, solid timelines. Time is represented as a spatial axis rather than a fluid flow.",
        "accentColor": "border-cyan-500/30 text-cyan-500 bg-cyan-500/5"
      },
      "bullets": [
        "Einstein's Spacetime: A static arena where all events coexist.",
        "The Materialist View: Past, present, and future are equally real and unchangeable.",
        "The Crisis: If the block is absolute and static, human choice, irreversible entropy, and quantum collapse are meaningless."
      ],
      "speakerNotes": "In general relativity, there is no unique 'now' for the entire universe. This led to the 'block universe.' But a purely static block is a thermodynamic and quantum dead end. We need bridges to show that real progression can co-exist within this geometry."
    },
    {
      "id": 3,
      "title": "Bridges of Passage",
      "subtitle": "Ewing (2025) & Vaccaro (2018)",
      "visualLayout": {
        "icon": "Activity",
        "description": "A wave function splitting into multiple branches within a stable, solid 4D spacetime matrix.",
        "accentColor": "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
      },
      "bullets": [
        "George Ellis (Evolving Block): Spacetime is built continuously at the present.",
        "N. Ewing (2025): Temporal passage can be structurally real, not just a subjective illusion.",
        "Joan Vaccaro (2018): Quantum-level asymmetry provides the 'motor' pushing our coordinate state forward."
      ],
      "speakerNotes": "These bridge theories allow us to rescue human dignity and agency. They demonstrate mathematically that real physical change can be integrated into a 4D spacetime coordinate system."
    },
    {
      "id": 4,
      "title": "Logos and Tropos",
      "subtitle": "Maximus the Confessor's Symphony",
      "visualLayout": {
        "icon": "Music",
        "description": "A golden musical staff with beautifully printed notes (Logos) being played by a free, expressive violinist (Tropos).",
        "accentColor": "border-indigo-500/30 text-indigo-500 bg-indigo-500/5"
      },
      "bullets": [
        "The Logos: The eternal musical composition written in God's love.",
        "The Tropos: Our free, dynamic, historical performance of that melody.",
        "Synergy (Synergeia): God does not play us like a puppet; He listens and integrates our performance into the master recording."
      ],
      "speakerNotes": "This is the ultimate patristic key. The Logos represents what we are made to be—our essential nature. The Tropos is how we walk that out. Sin is playing out-of-tune; holiness is playing a beautiful, free interpretation of the Composer's score."
    },
    {
      "id": 5,
      "title": "The 'Square Circle' of Coercion",
      "subtitle": "Sovereignty of Love",
      "visualLayout": {
        "icon": "HeartOff",
        "description": "A geometric contradiction—a shape trying to be simultaneously a sharp square and a perfect circle.",
        "accentColor": "border-rose-500/30 text-rose-500 bg-rose-500/5"
      },
      "bullets": [
        "Logical Absurdity: Force is external coercion; Love is internal free consent.",
        "The Forced Love Paradox: 'Freely grown love installed by force' is a logical self-contradiction.",
        "Divine Vulnerability: True communion requires a space where rejection is genuinely possible."
      ],
      "speakerNotes": "Explain the logical limits of power. God cannot make a rock so heavy He cannot lift it, nor can He force someone to love Him. Why? Because forced love is a logical self-contradiction. It ceases to be love the instant it is forced."
    },
    {
      "id": 6,
      "title": "The Dynamic Symphony of Prayer",
      "subtitle": "Co-Authoring the Cosmos",
      "visualLayout": {
        "icon": "Flame",
        "description": "A candle flame radiating outward, with dynamic lines intersecting and rewriting a golden book of decrees.",
        "accentColor": "border-violet-500/30 text-violet-500 bg-violet-500/5"
      },
      "bullets": [
        "Not a Pre-Recorded Tape: Prayer has real, active causal power.",
        "Timeless Alignment: Your prayer on the Road is heard in the Mountaintop's eternal Now.",
        "Relational Reality: We are genuine conversational partners, shaping the ultimate resolution of history."
      ],
      "speakerNotes": "End on a powerful devotional note. When we pray, we are not trying to change a rigid mechanical master plan. Our prayer is an input that God hears in His timeless now. The plan includes our free input."
    }
  ]
};
