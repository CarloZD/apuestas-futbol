const https = require('https');

const options = {
    headers: {
        'X-API-Key': 'zwc_free_d1774e387855b4a9941862ba'
    }
};

function get(url) {
    return new Promise((resolve, reject) => {
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log("Fetching teams...");
        const teams = await get('https://api.zafronix.com/fifa/worldcup/v1/teams?tournament=2026');
        console.log("Teams response format sample:", JSON.stringify(teams).substring(0, 500));
        
        console.log("\nFetching matches...");
        const matches = await get('https://api.zafronix.com/fifa/worldcup/v1/matches?year=2026');
        console.log("Matches response format sample:", JSON.stringify(matches).substring(0, 800));
    } catch (err) {
        console.error(err);
    }
}

run();
