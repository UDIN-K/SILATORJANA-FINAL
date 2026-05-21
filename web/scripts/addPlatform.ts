import { Client, Projects } from "node-appwrite";

const client = new Client()
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("69fd6737000dbdd02a67")
  .setKey("standard_9dd4f065af44a319b454264cc86639709b954002fe610cb9c11909c1359fbd576b684a66c9537a5b09cb0ab391f900743677aa4a59d0b72d49ede23d3b51f7461613b4616a4919c79f63260b531e1343a380a43011273e3905646adc59d6e2e38a0b3df2f3a13047454a6a3280dec8569c2b519d887122f8405133f29a973550");

const projects = new Projects(client);

async function run() {
  try {
    // Attempting to add a broad hostname or localhost.
    await projects.createPlatform('69fd6737000dbdd02a67', 'web', 'localhost', 'localhost');
    console.log("Added localhost platform");
  } catch (e: any) {
    console.log("Error localhost:", e.message);
  }
  
  try {
    // Attempting to add wildcard if supported, or the specific AI Studio domain
    await projects.createPlatform('69fd6737000dbdd02a67', 'web', 'ais-dev-5rdngedjfxyxd76fwez6mk-900499515128.asia-southeast1.run.app', 'ais-dev');
    console.log("Added ais-dev platform");
  } catch (e: any) {
    console.log("Error ais-dev:", e.message);
  }
  
  try {
    await projects.createPlatform('69fd6737000dbdd02a67', 'web', 'ais-pre-5rdngedjfxyxd76fwez6mk-900499515128.asia-southeast1.run.app', 'ais-pre');
    console.log("Added ais-pre platform");
  } catch (e: any) {
    console.log("Error ais-pre:", e.message);
  }

  // Also catchall or any others that might be used
  try {
    await projects.createPlatform('69fd6737000dbdd02a67', 'web', '*', 'Wildcard');
    console.log("Added wildcard platform");
  } catch(e:any) {
    console.log("Error wildcard:", e.message);
  }
}

run();
