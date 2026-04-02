import axios from "axios";
import { initialRegistry } from "./src/data/registry";

async function checkHealth() {
  console.log(`Checking ${initialRegistry.length} APIs...`);
  const results = [];
  
  // Use a smaller concurrency to avoid hitting rate limits or overwhelming the network
  const batchSize = 10;
  for (let i = 0; i < initialRegistry.length; i += batchSize) {
    const batch = initialRegistry.slice(i, i + batchSize);
    const batchPromises = batch.map(async (api) => {
      try {
        const response = await axios.get(api.Link, {
          timeout: 8000,
          headers: { "User-Agent": "Universal-API-Nexus/1.0" },
        });
        return { name: api.API, link: api.Link, status: "ok", code: response.status };
      } catch (error: any) {
        return {
          name: api.API,
          link: api.Link,
          status: "error",
          message: error.message,
          code: error.response?.status,
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    console.log(`Checked ${results.length}/${initialRegistry.length} APIs...`);
  }

  const failing = results.filter(r => r.status === "error");
  console.log("\n--- FAILING APIS ---");
  failing.forEach(f => {
    console.log(`${f.name} (${f.link}): ${f.message} (Code: ${f.code || 'N/A'})`);
  });
  
  console.log(`\nSummary: ${initialRegistry.length - failing.length} OK, ${failing.length} Failed.`);
}

checkHealth();
