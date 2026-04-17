import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

const COMPANY_DATA_DIR = path.resolve(__dirname, "../company_questions");
const SCRAPED_DATA_DIR = path.resolve(__dirname, "../../external-data-source/data/problems");
const OUTPUT_DIR = path.resolve(__dirname, "../public/data");

interface RawCsvRecord {
  ID: string;
  URL: string;
  Title: string;
  Difficulty: string;
  "Acceptance %": string;
  "Frequency %": string;
}

interface Question {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  acceptance: string;
  frequency: number;
  rawScore: number;
  link: string;
  companies: Set<string>;
  timeframes: Record<string, string>;
  topics: string[];
}

const normalizeDifficulty = (val: string): string => {
  const v = val.toLowerCase();
  if (v.includes("hard")) return "Hard";
  if (v.includes("medium")) return "Medium";
  return "Easy";
};

const deriveSlug = (url: string): string => {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
};

const formatCompanyName = (slug: string): string => {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .replace(/\b(And|Of|In|At|The)\b/g, (m) => m.toLowerCase())
    .replace(/\b(Ai|Ui|Us|Uk|Jp)\b/g, (m) => m.toUpperCase());
};

const EXTERNAL_COMPANY_DATA_DIR = path.resolve(__dirname, "../../external-data-source/data/companies");

async function main() {
  console.log("🚀 Starting comprehensive prebuild process...");
  
  const topicMap = new Map<string, string[]>();
  try {
    const files = await fs.readdir(SCRAPED_DATA_DIR);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const content = await fs.readFile(path.join(SCRAPED_DATA_DIR, file), "utf8");
        const data = JSON.parse(content);
        if (data.slug && data.topics) topicMap.set(data.slug, data.topics);
      }
    }
    console.log(`✅ Loaded topics for ${topicMap.size} questions.`);
  } catch (e) {
    console.warn("⚠️ Could not load scraped topics, proceeding without them.");
  }

  const questionsMap = new Map<string, Question>();

  // --- Phase 1: Local Data Ingestion (Source of Truth for Frequency) ---
  const localCompanies = await fs.readdir(COMPANY_DATA_DIR);
  console.log(`🔍 Processing ${localCompanies.length} local firm folders...`);

  for (const company of localCompanies) {
    const companyPath = path.join(COMPANY_DATA_DIR, company);
    const stats = await fs.stat(companyPath);
    if (!stats.isDirectory()) continue;

    const timeframeFiles = await fs.readdir(companyPath);
    for (const file of timeframeFiles) {
      if (!file.endsWith(".csv")) continue;

      const timeframe = file.replace(".csv", "");
      const content = await fs.readFile(path.join(companyPath, file), "utf8");
      const records = parse(content, { columns: true, skip_empty_lines: true }) as RawCsvRecord[];

      for (const record of records) {
        const slug = deriveSlug(record.URL);
        if (!slug) continue;
        const freq = parseFloat(record["Frequency %"]) || 0;

        if (!questionsMap.has(slug)) {
          questionsMap.set(slug, {
            id: record.ID,
            title: record.Title,
            slug,
            difficulty: normalizeDifficulty(record.Difficulty),
            acceptance: record["Acceptance %"],
            frequency: freq,
            rawScore: freq,
            link: record.URL,
            companies: new Set([company]),
            timeframes: { [company]: timeframe },
            topics: topicMap.get(slug) || [],
          });
        } else {
          const q = questionsMap.get(slug)!;
          q.companies.add(company);
          q.rawScore += freq; // Cumulative score
          q.frequency = Math.max(q.frequency, freq);
          if (!q.timeframes[company] || freq > (parseFloat(q.timeframes[company]) || 0)) {
            q.timeframes[company] = timeframe;
          }
        }
      }
    }
  }

  // --- Phase 2: External Data Ingestion (Question Bank Expansion) ---
  try {
    const extCompanies = await fs.readdir(EXTERNAL_COMPANY_DATA_DIR);
    console.log(`🌍 Injecting ${extCompanies.length} External company datasets...`);

    for (const file of extCompanies) {
      if (!file.endsWith(".csv")) continue;

      const companySlug = file.replace(".csv", "");
      const content = await fs.readFile(path.join(EXTERNAL_COMPANY_DATA_DIR, file), "utf8");
      const records = parse(content, { columns: true, skip_empty_lines: true }) as RawCsvRecord[];

      for (const record of records) {
        const slug = deriveSlug(record.URL);
        if (!slug) continue;
        const freq = parseFloat(record["Frequency %"]) || 0;

        if (!questionsMap.has(slug)) {
          // New Question discovered in External Source
          questionsMap.set(slug, {
            id: record.ID,
            title: record.Title,
            slug,
            difficulty: normalizeDifficulty(record.Difficulty),
            acceptance: record["Acceptance %"],
            frequency: freq,
            rawScore: freq,
            link: record.URL,
            companies: new Set([companySlug]),
            timeframes: { [companySlug]: "all-time" },
            topics: topicMap.get(slug) || [],
          });
        } else {
          // Existing Question - Merge Company and Update Metadata
          const q = questionsMap.get(slug)!;
          q.companies.add(companySlug);
          q.rawScore += freq; 
          q.frequency = Math.max(q.frequency, freq);
          
          if (!q.timeframes[companySlug]) {
            q.timeframes[companySlug] = "all-time";
          }
        }
      }
    }
  } catch (e) {
    console.warn("⚠️ External base datasets missing or inaccessible.");
  }

  // --- Phase 3: Rank Assignment ---
  console.log("⚖️ Finalizing metadata and assigning serials...");
  const questionsList = Array.from(questionsMap.values());
  
  // Sort by rawScore descending to find the top questions
  questionsList.sort((a, b) => b.rawScore - a.rawScore);

  const allQuestions = questionsList.map((q, index) => ({
    ...q,
    serial: index + 1,
    frequency: Number(q.frequency.toFixed(1)),
    companies: Array.from(q.companies)
  }));

  const companiesList = Array.from(new Set(allQuestions.flatMap(q => q.companies))).sort().map(c => ({
    slug: c,
    displayName: formatCompanyName(c),
    count: allQuestions.filter(q => q.companies.includes(c)).length
  }));

  const topicsList = Array.from(new Set(allQuestions.flatMap(q => q.topics))).sort().map(t => ({
    name: t,
    slug: t.toLowerCase().replace(/\s+/g, "-"),
    count: allQuestions.filter(q => q.topics.includes(t)).length
  }));

  const data = {
    questions: allQuestions,
    companies: companiesList,
    topics: topicsList,
    updatedAt: new Date().toISOString()
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUTPUT_DIR, "questions.json"), JSON.stringify(data, null, 2));

  console.log(`✨ Successfully generated data for ${allQuestions.length} questions across ${companiesList.length} firms!`);
}

main().catch((err) => {
  console.error("❌ Prebuild failed:", err);
  process.exit(1);
});
