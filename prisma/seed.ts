import { getBlockingEnvironmentErrors } from "../src/lib/config";
import { runIntentToAudienceEngine } from "../src/lib/pipeline/run-intent-engine";
import { prisma } from "../src/lib/prisma";

async function main() {
  const blockingErrors = getBlockingEnvironmentErrors();

  if (blockingErrors.length) {
    throw new Error(blockingErrors.map((notice) => `${notice.title}: ${notice.message}`).join("\n"));
  }

  await prisma.audienceRecipe.deleteMany();
  await prisma.signalAnalysis.deleteMany();
  await prisma.audienceCluster.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.rule.deleteMany();

  const summary = await runIntentToAudienceEngine();

  console.log("Seed complete", summary);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
