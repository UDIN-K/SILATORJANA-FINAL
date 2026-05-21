const projectId = '69fd6737000dbdd02a67';
const key = 'standard_9dd4f065af44a319b454264cc86639709b954002fe610cb9c11909c1359fbd576b684a66c9537a5b09cb0ab391f900743677aa4a59d0b72d49ede23d3b51f7461613b4616a4919c79f63260b531e1343a380a43011273e3905646adc59d6e2e38a0b3df2f3a13047454a6a3280dec8569c2b519d887122f8405133f29a973550';
const endpoint = 'https://sgp.cloud.appwrite.io/v1';

async function run() {
  const platforms = [
    'localhost',
    'ais-dev-5rdngedjfxyxd76fwez6mk-900499515128.asia-southeast1.run.app',
    'ais-pre-5rdngedjfxyxd76fwez6mk-900499515128.asia-southeast1.run.app',
    '*'
  ];

  for (const host of platforms) {
    try {
      const payload = {
        type: 'web',
        name: 'Platform ' + host,
        key: host,
        hostname: host
      };
      
      const res = await fetch(endpoint + '/projects/' + projectId + '/platforms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': projectId,
          'X-Appwrite-Key': key
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('Added ' + host + ':', data);
    } catch(e:any) {
      console.log('Error adding ' + host + ':', e.message);
    }
  }
}

run();
