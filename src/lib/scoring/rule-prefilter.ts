import type { Rule, Signal } from "../../generated/prisma/client";

export type RuleMatch = {
  ruleName: string;
  sport: string;
  matchedKeywords: string[];
};

function normalize(input: string) {
  return input.toLowerCase();
}

function extractKeywords(queryText: string) {
  return queryText
    .split(",")
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
}

export function matchSignalToRules(signal: Pick<Signal, "postText">, rules: Rule[]): RuleMatch | null {
  const text = normalize(signal.postText);

  const matches = rules
    .filter((rule) => rule.enabled)
    .map((rule) => {
      const keywords = extractKeywords(rule.queryText);
      const matchedKeywords = keywords.filter((keyword) => text.includes(keyword));

      return {
        ruleName: rule.name,
        sport: rule.sport,
        matchedKeywords
      };
    })
    .filter((result) => result.matchedKeywords.length > 0)
    .sort((left, right) => right.matchedKeywords.length - left.matchedKeywords.length);

  return matches[0] ?? null;
}


