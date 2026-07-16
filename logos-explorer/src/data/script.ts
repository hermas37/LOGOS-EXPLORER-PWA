export interface ScriptCard {
  id: string;
  title: string;
  text: string;
  citations: {
    phrase: string;
    source: string;
    detail: string;
  }[];
}

export const EPISODE_SCRIPTS: Record<string, ScriptCard[]> = {
  "episode-1": [
    {
      "id": "sec-1",
      "title": "1. The Mountain and the Road (The View of Eternity)",
      "text": "Imagine standing on the peak of a towering mountain. From this height, you see the entire road below—you see the traveler starting his walk in the morning, taking lunch at noon, and reaching the inn at sunset. You see all these moments in a single, timeless glance. But the traveler on the road only experiences the journey step-by-step. This is the classic distinction between eternity and linear time.",
      "citations": [
        {
          "phrase": "timeless glance",
          "source": "Boethius, De Consolatione Philosophiae, Book V",
          "detail": "Boethius defined eternity as 'the complete possession of endless life all at once.' God's timeless knowledge sees our past, present, and future as an eternal present, without forcing or coercing our choices."
        },
        {
          "phrase": "traveler on the road",
          "source": "St. Augustine, Confessions, Book XI",
          "detail": "Augustine points out that human consciousness resides strictly in the transition from what is no longer to what is yet to come, whereas God resides in the everlasting present."
        }
      ]
    },
    {
      "id": "sec-2",
      "title": "2. The Block Universe and Its Bridges",
      "text": "Modern physics introduces the 'block universe,' a four-dimensional coordinate grid where past, present, and future all co-exist statically. Many materialists claim this means time-passage is a total illusion. However, cosmologist George Ellis argues this model is physically incomplete because it fails to capture irreversible processes. Excitingly, Ewing and Joan Vaccaro show how real quantum passage can still exist within a static 4D block.",
      "citations": [
        {
          "phrase": "George Ellis",
          "source": "George F. R. Ellis (2014) - 'The Evolving Block Universe'",
          "detail": "Ellis argues that the classical static block cannot account for wave-function collapse (quantum measurement) and biological self-organization, which represent irreversible historical processes that continuously build the block."
        },
        {
          "phrase": "Ewing and Joan Vaccaro",
          "source": "N. Ewing (2025) & J. Vaccaro (2018) 'Quantum Passage'",
          "detail": "Vaccaro's work suggests quantum-level dynamics drive a progression through the temporal dimension, serving as a scientific bridge between static 4D structures and subjective flow."
        }
      ]
    },
    {
      "id": "sec-3",
      "title": "3. The Melody of Logos and Tropos",
      "text": "The ancient theology of Maximus the Confessor resolves this through the concepts of Logos and Tropos. The Logos is the unchangeable, loving blueprint of who God designed you to be—the perfect sheet music written by the Composer. The Tropos is your dynamic, free manner of playing that melody. The Composer does not pre-record your performance; He writes the score and invites you to play it freely.",
      "citations": [
        {
          "phrase": "Logos and Tropos",
          "source": "Maximus the Confessor, Ambigua 7 / Ad Thalassium 22",
          "detail": "Maximus explains that while the logos of nature is fixed eternally in the divine will, the tropos (the mode of existence) is free, contingent, and determined by our daily moral choices."
        },
        {
          "phrase": "Composer",
          "source": "C.S. Lewis, Mere Christianity",
          "detail": "Lewis suggests God is not a force pre-recording a tape, but the writer of a play who enters into His own creation to guide it through relation."
        }
      ]
    },
    {
      "id": "sec-4",
      "title": "4. Sovereign Love and the 'Square Circle'",
      "text": "Why did God not just create us perfectly loving from the start? Because 'freely grown love that is installed by force' is a logical impossibility—a square circle. Love is not a mechanical state; it is an active history of uncoerced, reciprocal choices. For love to exist, there must be a genuine road where travelers can choose to turn back or walk forward.",
      "citations": [
        {
          "phrase": "logical impossibility",
          "source": "Alvin Plantinga, The Free Will Defense",
          "detail": "Plantinga demonstrates that even omnipotence cannot perform logical absurdities. Creating a free creature who is forced to do only good is a logical contradiction."
        },
        {
          "phrase": "square circle",
          "source": "Thomas Aquinas, Summa Theologiae, I, Q.25, A.3",
          "detail": "Aquinas argues that God's power is not limited because He cannot perform contradictions; rather, contradictory concepts are not 'things' that can be done."
        }
      ]
    },
    {
      "id": "sec-5",
      "title": "5. Prayer as Co-Creation",
      "text": "This means prayer is not reading lines from a pre-determined script. In God's eternal now, your active prayer is a real, dynamic force. When you pray on the road, you are aligning your tropos with the eternal Logos, co-authoring the history of the universe. God's mountaintop view encompasses your free prayer and His loving response in a single, perfect eternal melody.",
      "citations": [
        {
          "phrase": "not reading lines",
          "source": "Søren Kierkegaard, Christian Discourses",
          "detail": "Kierkegaard notes: 'The function of prayer is not to influence God, but rather to change the nature of the one who prays.'"
        },
        {
          "phrase": "eternal now",
          "source": "Boethius, Consolation V, Prose 6",
          "detail": "Since God is eternal, His knowledge does not precede our actions in time. Instead, He holds our free prayers in His simultaneous present, letting our choices have genuine causal power."
        }
      ]
    }
  ]
};
