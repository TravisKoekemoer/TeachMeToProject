import type { XIngestionSignal } from "../lib/providers/x/types";

type Market = {
  city: string;
  state: string;
  country: "USA";
};

type SportConfig = {
  sport: "tennis" | "golf" | "pickleball";
  noun: string;
  coachTerm: string;
  youthTerm: string;
  introTerm: string;
  hashtags: string[];
};

type SignalSegment =
  | "urgent_booking"
  | "strong_buyer"
  | "parent_youth"
  | "general_improvement"
  | "mid_intent"
  | "weak_intent"
  | "low_match"
  | "noise";

type TemplateFn = (cfg: SportConfig, market: Market) => string;

type SegmentTemplateGroup = {
  segment: SignalSegment;
  marketOffset: number;
  templates: TemplateFn[];
};

const markets: Market[] = [
  { city: "Scottsdale", state: "AZ", country: "USA" },
  { city: "Phoenix", state: "AZ", country: "USA" },
  { city: "Austin", state: "TX", country: "USA" },
  { city: "Dallas", state: "TX", country: "USA" },
  { city: "San Diego", state: "CA", country: "USA" },
  { city: "Los Angeles", state: "CA", country: "USA" },
  { city: "Miami", state: "FL", country: "USA" },
  { city: "Tampa", state: "FL", country: "USA" },
  { city: "Atlanta", state: "GA", country: "USA" },
  { city: "Charlotte", state: "NC", country: "USA" },
  { city: "Denver", state: "CO", country: "USA" },
  { city: "Seattle", state: "WA", country: "USA" },
  { city: "Chicago", state: "IL", country: "USA" },
  { city: "Nashville", state: "TN", country: "USA" },
  { city: "Orlando", state: "FL", country: "USA" },
  { city: "Salt Lake City", state: "UT", country: "USA" }
];

const sportConfigs: SportConfig[] = [
  {
    sport: "tennis",
    noun: "tennis",
    coachTerm: "tennis coach",
    youthTerm: "junior tennis",
    introTerm: "adult beginner tennis",
    hashtags: ["#tennis", "#tennislessons", "#learntennis"]
  },
  {
    sport: "golf",
    noun: "golf",
    coachTerm: "golf instructor",
    youthTerm: "junior golf",
    introTerm: "beginner golf",
    hashtags: ["#golf", "#golflessons", "#swinghelp"]
  },
  {
    sport: "pickleball",
    noun: "pickleball",
    coachTerm: "pickleball coach",
    youthTerm: "youth pickleball",
    introTerm: "beginner pickleball",
    hashtags: ["#pickleball", "#pickleballlessons", "#dinkbetter"]
  }
];

const strongBuyerTemplates: TemplateFn[] = [
  (cfg, market) =>
    `Looking for a ${cfg.coachTerm} in ${market.city}, ${market.state}. I am brand new and want weekly ${cfg.noun} lessons starting next month. ${cfg.hashtags[0]}`,
  (cfg, market) =>
    `Any recs for private ${cfg.noun} lessons near ${market.city}? Adult beginner here and ready to book a package if the coach is patient.`,
  (cfg, market) =>
    `Need a local ${cfg.coachTerm} around ${market.city}, ${market.state}. I have a work trip in six weeks and want to stop embarrassing myself. ${cfg.hashtags[1]}`,
  (cfg, market) =>
    `Who offers weekend ${cfg.noun} classes in ${market.city}? Budget is not the issue, I just want solid instruction and fast improvement.`,
  (cfg, market) =>
    `Finally committing to ${cfg.noun}. If you know a great ${cfg.coachTerm} in ${market.city}, send them my way because I want to start this week.`,
  (cfg, market) =>
    `I keep putting off lessons. Time to fix that. Searching for an adult-friendly ${cfg.coachTerm} in ${market.city}, ${market.state} with evening availability.`,
  (cfg, market) =>
    `Can someone point me to a patient ${cfg.coachTerm} in ${market.city}? I want to buy a starter lesson package before a trip with friends.`,
  (cfg, market) =>
    `Looking to book my first ${cfg.noun} lesson in ${market.city} this weekend. Prefer private instruction and happy to pay for quality.`,
  (cfg, market) =>
    `Moved to ${market.city} and want to start ${cfg.noun} properly. Need a coach who offers adult intro packages and can meet weekly.`,
  (cfg, market) =>
    `Any premium ${cfg.noun} academy in ${market.city}? I want an evaluation plus a short package of lessons.`,
  (cfg, market) =>
    `I promised coworkers I would join their ${cfg.noun} outing, so I need a ${cfg.coachTerm} in ${market.city} as soon as possible.`,
  (cfg, market) =>
    `Ready to spend on structured ${cfg.noun} lessons near ${market.city}. Looking for someone who can start next week.`
];

const urgentBookingTemplates: TemplateFn[] = [
  (cfg, market) =>
    `I need to book private ${cfg.noun} lessons in ${market.city} this week and I am happy to pay for the first available slot.`,
  (cfg, market) =>
    `Who can take a brand new ${cfg.noun} player in ${market.city} tomorrow? Ready to book a starter package right away.`,
  (cfg, market) =>
    `Need a ${cfg.coachTerm} in ${market.city} immediately. I want to pay for an evaluation and weekly lessons starting now.`,
  (cfg, market) =>
    `I am ready to spend on a private ${cfg.noun} package in ${market.city}. Who has the earliest opening this weekend?`,
  (cfg, market) =>
    `Please send me your best ${cfg.noun} instructor in ${market.city}. I want to book two paid sessions before next week.`,
  (cfg, market) =>
    `My schedule finally opened up and I want to book ${cfg.noun} lessons in ${market.city} today. Budget is ready and I want a coach now.`
];

const parentYouthTemplates: TemplateFn[] = [
  (cfg, market) =>
    `My 10 year old wants ${cfg.youthTerm} lessons in ${market.city}. Looking for a coach who works well with beginners and can do after school.`,
  (cfg, market) =>
    `Parents in ${market.city}: who runs the best youth ${cfg.noun} program? My daughter wants to try a clinic before summer.`,
  (cfg, market) =>
    `Need a ${cfg.noun} coach for my middle schooler near ${market.city}, ${market.state}. Happy to pay for private sessions if it keeps them engaged.`,
  (cfg, market) =>
    `Any family-friendly ${cfg.noun} academy in ${market.city}? Looking for junior lessons and maybe a beginner session for me too.`,
  (cfg, market) =>
    `Trying to find a reputable youth ${cfg.noun} camp in ${market.city} for spring break. Bonus if they can assess skill level before signup.`,
  (cfg, market) =>
    `Looking for a gentle ${cfg.coachTerm} in ${market.city} for my son who is just getting started. Weekend lessons preferred.`,
  (cfg, market) =>
    `Any parents in ${market.city} know a good junior ${cfg.noun} coach with private and small-group options?`,
  (cfg, market) =>
    `Need help finding youth ${cfg.noun} lessons in ${market.city}. My kid is excited, but I want an instructor who keeps it fun.`,
  (cfg, market) =>
    `Searching for a spring junior ${cfg.noun} clinic around ${market.city} and open to private coaching after that if it goes well.`,
  (cfg, market) =>
    `My teenager wants to improve quickly before school tryouts. Who is the best ${cfg.coachTerm} near ${market.city}?`
];

const improvementTemplates: TemplateFn[] = [
  (cfg, market) =>
    `Been playing ${cfg.noun} casually in ${market.city} and wondering if lessons are worth it for consistency. Anyone see real progress after a few sessions?`,
  (cfg, market) =>
    `Not sure I need a full-time coach, but I do need help with fundamentals. Thinking about one ${cfg.noun} clinic in ${market.city}.`,
  (cfg, market) =>
    `My friends say I should get a ${cfg.coachTerm}. I mainly want cleaner technique and less frustration. Maybe a group class near ${market.city}?`,
  (cfg, market) =>
    `Could use a little structure with my ${cfg.noun} practice in ${market.city}. Looking for drills, classes, or a coach who works with improvers.`,
  (cfg, market) =>
    `Question for ${cfg.noun} people in ${market.city}: best beginner clinic if I just want to level up before summer leagues? ${cfg.hashtags[2]}`,
  (cfg, market) =>
    `I am not a total beginner anymore, but my ${cfg.noun} fundamentals are messy. Thinking about a few private lessons in ${market.city}.`,
  (cfg, market) =>
    `Has anyone in ${market.city} taken a weekend ${cfg.noun} clinic and seen real improvement?`,
  (cfg, market) =>
    `I probably need a coach for ${cfg.noun}, just not sure if I should do weekly lessons or a short package first.`,
  (cfg, market) =>
    `Looking for one or two ${cfg.noun} lessons in ${market.city} to clean up technique before league play.`,
  (cfg, market) =>
    `Any instructor in ${market.city} who works well with adult improvers instead of true beginners?`
];

const midIntentTemplates: TemplateFn[] = [
  (cfg, market) =>
    `Comparing a few ${cfg.noun} lesson options in ${market.city}. I probably want 2 or 3 sessions, just trying to figure out the best fit.`,
  (cfg, market) =>
    `Anyone in ${market.city} know what beginner ${cfg.noun} lessons usually cost? I may book if pricing feels reasonable.`,
  (cfg, market) =>
    `I am leaning toward a short ${cfg.noun} lesson package in ${market.city}, but deciding between private lessons and a clinic.`,
  (cfg, market) =>
    `Could use a ${cfg.coachTerm} in ${market.city}, though I am still comparing whether lessons or drills with friends make more sense.`,
  (cfg, market) =>
    `What is the better move for an adult improver in ${market.city}: one private ${cfg.noun} lesson or a beginner clinic?`,
  (cfg, market) =>
    `Trying to decide if I should book ${cfg.noun} lessons before summer leagues or wait until I plateau a bit more.`,
  (cfg, market) =>
    `If anyone has pricing recommendations for ${cfg.coachTerm} options in ${market.city}, I am gathering options now and may start soon.`,
  (cfg, market) =>
    `I want to improve at ${cfg.noun} and will probably try lessons in ${market.city}, but I am still comparing instructors and schedules.`
];

const weakIntentTemplates: TemplateFn[] = [
  (cfg, market) =>
    `Thinking about ${cfg.noun} lessons eventually in ${market.city}, but unsure whether a coach is worth it for casual play.`,
  (cfg, market) =>
    `Do group ${cfg.noun} classes in ${market.city} actually help if you only play once a week?`,
  (cfg, market) =>
    `Might book a ${cfg.noun} clinic later this summer if people think it is worth the money.`,
  (cfg, market) =>
    `Curious whether one private ${cfg.noun} lesson can fix basic mistakes or if I should just watch videos.`,
  (cfg, market) =>
    `My partner wants me to try ${cfg.noun} lessons in ${market.city}; I am still on the fence.`,
  (cfg) =>
    `Anyone regret paying for a ${cfg.coachTerm}? I only play for fun but could use some direction.`,
  (cfg) =>
    `Maybe I need a coach for ${cfg.noun}, maybe I just need reps. Hard to tell right now.`,
  (cfg, market) =>
    `Would a beginner ${cfg.noun} class in ${market.city} be overkill if I only want to stop feeling awkward at open play?`
];

const lowMatchTemplates: TemplateFn[] = [
  (cfg, market) =>
    `I keep seeing ads for ${cfg.noun} lessons in ${market.city}. Do people actually stick with them?`,
  (cfg) =>
    `Watching beginner ${cfg.noun} lesson videos tonight instead of hiring a coach for now.`,
  (cfg, market) =>
    `A friend offered me a free intro ${cfg.noun} clinic in ${market.city}, which sounds easier than paying for lessons.`,
  (cfg, market) =>
    `Do most people really need a ${cfg.coachTerm}, or is casual play in ${market.city} enough?`,
  (cfg, market) =>
    `I might try one ${cfg.noun} class someday, but for now I am mostly just borrowing gear and seeing if I even like it.`,
  (cfg) =>
    `Not convinced private ${cfg.noun} lessons are necessary when there are so many free tips online.`,
  (cfg, market) =>
    `My neighborhood club added ${cfg.noun} classes in ${market.city}; I am curious, but mostly because everyone keeps talking about them.`,
  (cfg, market) =>
    `Anyone ever sign up for a ${cfg.noun} clinic in ${market.city} and realize they would rather just play socially?`
];

const noiseTemplates: TemplateFn[] = [
  (cfg, market) =>
    `The new ${cfg.noun} shoes I bought in ${market.city} are incredible. No notes.`,
  (cfg) =>
    `Watching pro ${cfg.noun} highlights all night and convincing myself I can totally do that tomorrow.`,
  (cfg, market) =>
    `Traffic to the ${cfg.noun} facility in ${market.city} was brutal but the sunset made up for it.`,
  (cfg, market) =>
    `If anyone in ${market.city} finds my lucky ${cfg.noun} towel, please return it immediately.`,
  (cfg) =>
    `Hot take: snacks after ${cfg.noun} are more important than stretching.`,
  (cfg) =>
    `I could talk about pro ${cfg.noun} rankings for hours and still be wrong.`,
  (cfg, market) =>
    `The weather in ${market.city} was perfect for ${cfg.noun} today.`,
  (cfg) =>
    `Spent more time talking about ${cfg.noun} gear than actually playing and honestly that felt right.`
];

const handles = [
  "courtcraft",
  "sliceandstride",
  "newgripszn",
  "weekendwinger",
  "juniordreams",
  "cityswingnotes",
  "sunbeltplayer",
  "servesandstories",
  "baselinebrunch",
  "fairwayhabit",
  "driveanddrop",
  "dinkdiary",
  "matchpointmaybe",
  "lessonledger",
  "metrorecrec",
  "openplayjournal"
];

const segmentTemplateGroups: SegmentTemplateGroup[] = [
  {
    segment: "urgent_booking",
    marketOffset: 0,
    templates: urgentBookingTemplates
  },
  {
    segment: "strong_buyer",
    marketOffset: 1,
    templates: strongBuyerTemplates
  },
  {
    segment: "parent_youth",
    marketOffset: 3,
    templates: parentYouthTemplates
  },
  {
    segment: "general_improvement",
    marketOffset: 5,
    templates: improvementTemplates
  },
  {
    segment: "mid_intent",
    marketOffset: 7,
    templates: midIntentTemplates
  },
  {
    segment: "weak_intent",
    marketOffset: 9,
    templates: weakIntentTemplates
  },
  {
    segment: "low_match",
    marketOffset: 11,
    templates: lowMatchTemplates
  },
  {
    segment: "noise",
    marketOffset: 13,
    templates: noiseTemplates
  }
];

const hotspotHeavySegments = new Set<SignalSegment>([
  "urgent_booking",
  "strong_buyer",
  "parent_youth",
  "general_improvement",
  "mid_intent"
]);

const hotspotMediumSegments = new Set<SignalSegment>(["weak_intent", "low_match"]);

const hotspotMarketIndexes: Record<SportConfig["sport"], number[]> = {
  tennis: [0, 0, 1, 0],
  golf: [0, 0, 0, 1],
  pickleball: [1, 1, 0, 1]
};

const marchDayWeights = [
  1, 2, 4, 5, 4, 2, 1,
  2, 4, 6, 5, 4, 2, 1,
  2, 4, 5, 7, 6, 4, 1,
  2, 5, 8, 7, 5, 9, 3,
  1, 4, 3
];

const weightedMarchDays = marchDayWeights.flatMap((weight, index) =>
  Array.from({ length: weight }, () => index + 1)
);

const segmentRecencyOffsets: Record<SignalSegment, number> = {
  urgent_booking: 29,
  strong_buyer: 23,
  parent_youth: 17,
  general_improvement: 13,
  mid_intent: 9,
  weak_intent: 5,
  low_match: 2,
  noise: 0
};

function buildCreatedAt(id: number, sportIndex: number, segment: SignalSegment, templateIndex: number) {
  const weightedIndex =
    (id * 11 + sportIndex * 17 + templateIndex * 7 + segmentRecencyOffsets[segment]) % weightedMarchDays.length;
  const day = weightedMarchDays[weightedIndex];
  const hourSlots = [7, 8, 9, 11, 12, 15, 17, 18, 19, 20];
  const minuteSlots = [3, 11, 18, 26, 34, 41, 49, 56];
  const hour = hourSlots[(id + templateIndex + sportIndex) % hourSlots.length];
  const minute = minuteSlots[(id * 3 + templateIndex + sportIndex) % minuteSlots.length];

  return new Date(Date.UTC(2026, 2, day, hour, minute)).toISOString();
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function marketByIndex(index: number) {
  return markets[((index % markets.length) + markets.length) % markets.length];
}

function selectMarket(cfg: SportConfig, sportIndex: number, group: SegmentTemplateGroup, templateIndex: number) {
  const distributedMarket = marketByIndex(sportIndex * 3 + group.marketOffset + templateIndex);
  const hotspotIndexes = hotspotMarketIndexes[cfg.sport];

  if (hotspotHeavySegments.has(group.segment) && templateIndex % 5 !== 4) {
    return marketByIndex(hotspotIndexes[templateIndex % hotspotIndexes.length]);
  }

  if (hotspotMediumSegments.has(group.segment) && templateIndex % 4 === 0) {
    return marketByIndex(hotspotIndexes[(templateIndex + sportIndex) % hotspotIndexes.length]);
  }

  return distributedMarket;
}

function createSignal(
  id: number,
  cfg: SportConfig,
  market: Market,
  text: string,
  segment: SignalSegment,
  templateIndex: number,
  sportIndex: number
): XIngestionSignal {
  const handle = `${slugify(market.city)}_${handles[id % handles.length]}_${cfg.sport.slice(0, 3)}`;
  const platformSignalId = `x_mock_${id.toString().padStart(3, "0")}`;
  const createdAt = buildCreatedAt(id, sportIndex, segment, templateIndex);

  return {
    platformSignalId,
    authorHandle: handle,
    authorDisplayName: `${market.city} ${cfg.sport[0].toUpperCase()}${cfg.sport.slice(1)} Fan ${id}`,
    postText: text,
    postUrl: `https://x.com/${handle}/status/${platformSignalId}`,
    createdAt,
    rawJson: {
      source: "mock-x",
      engagement: {
        likes: 4 + (id % 37),
        replies: id % 9,
        reposts: id % 6
      },
      inferred_market: market,
      sport_hint: cfg.sport,
      segment,
      template_index: templateIndex
    }
  };
}

export const mockSignals: XIngestionSignal[] = sportConfigs.flatMap((cfg, sportIndex) => {
  const rows: XIngestionSignal[] = [];
  let idCursor = sportIndex * 100 + 1;

  segmentTemplateGroups.forEach((group) => {
    group.templates.forEach((template, templateIndex) => {
      const market = selectMarket(cfg, sportIndex, group, templateIndex);
      rows.push(createSignal(idCursor++, cfg, market, template(cfg, market), group.segment, templateIndex, sportIndex));
    });
  });

  return rows;
});


