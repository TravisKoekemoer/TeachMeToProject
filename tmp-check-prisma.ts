import { prisma } from "./src/lib/prisma";

(async () => {
  try {
    const counts = await Promise.all([
      prisma.signal.count(),
      prisma.signalAnalysis.count(),
      prisma.audienceCluster.count(),
      prisma.audienceRecipe.count()
    ]);
    console.log("prisma-ok", counts.join(","));
  } catch (error) {
    console.error("prisma-fail");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();