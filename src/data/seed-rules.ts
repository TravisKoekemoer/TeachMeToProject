export type SeedRule = {
  name: string;
  queryText: string;
  enabled: boolean;
  sport: "tennis" | "golf" | "pickleball";
  geographyHint: string | null;
};

export const seedRules: SeedRule[] = [
  {
    name: "Tennis booking intent",
    queryText: "tennis lessons, tennis coach, tennis classes, private tennis lesson, beginner tennis",
    enabled: true,
    sport: "tennis",
    geographyHint: "US metro"
  },
  {
    name: "Tennis youth intent",
    queryText: "junior tennis, tennis coach for my kid, tennis camp, junior tennis lessons",
    enabled: true,
    sport: "tennis",
    geographyHint: "suburban families"
  },
  {
    name: "Golf booking intent",
    queryText: "golf lessons, golf coach, golf instructor, swing coach, golf clinic",
    enabled: true,
    sport: "golf",
    geographyHint: "US metro"
  },
  {
    name: "Golf youth intent",
    queryText: "junior golf, golf coach for my son, golf camp, youth golf lessons",
    enabled: true,
    sport: "golf",
    geographyHint: "family markets"
  },
  {
    name: "Pickleball booking intent",
    queryText: "pickleball lessons, pickleball coach, beginner pickleball class, pickleball clinic",
    enabled: true,
    sport: "pickleball",
    geographyHint: "retiree + suburban"
  },
  {
    name: "Pickleball improvement intent",
    queryText: "improve my dink, pickleball drills, open play confidence, pickleball strategy",
    enabled: true,
    sport: "pickleball",
    geographyHint: "community clubs"
  }
];

