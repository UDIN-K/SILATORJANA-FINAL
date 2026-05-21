import { Client, Databases, Permission, Role } from "node-appwrite";

const client = new Client()
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("69fd6737000dbdd02a67")
  .setKey("standard_9dd4f065af44a319b454264cc86639709b954002fe610cb9c11909c1359fbd576b684a66c9537a5b09cb0ab391f900743677aa4a59d0b72d49ede23d3b51f7461613b4616a4919c79f63260b531e1343a380a43011273e3905646adc59d6e2e38a0b3df2f3a13047454a6a3280dec8569c2b519d887122f8405133f29a973550");

const db = new Databases(client);
const dbId = "69fd691800237a6aaa72";

async function run() {
  const colls = ['iku', 'kak', 'rab', 'indikator_kegiatan', 'status_history', 'jurusan', 'users', 'iku_master', 'kegiatan', 'notifikasi'];
  
  for (const c of colls) {
    try {
      await db.updateCollection(dbId, c, c, [
        Permission.read(Role.any()),
        Permission.write(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ]);
      console.log(`Updated permissions for ${c}`);
    } catch(e:any) {
      console.log(`Failed to update ${c}: ${e.message}`);
    }
  }
}
run();
