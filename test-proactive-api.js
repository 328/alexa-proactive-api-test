// Alexa Proactive API sample script

const https = require('https');
const mode = 'dev';

const clientID = ``;

const clientSecret = ``;

let userId1 = ``;

notify(userId1);

async function notify(userId) {
    const token = await getToken();
    const status = await sendEvent(token, userId);

    return status;
}

function getProactiveOptions(token, postLength){

    return {
        hostname: 'api.fe.amazonalexa.com',
        port: 443,
        path: '/v1/proactiveEvents/stages/development',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postLength,
            'Authorization' : 'Bearer ' + token
        }
    };
}

function getProactivePostData(userId) {
    return getStatusEvent(userId);
}

function getStatusEvent(userId) {

    let timestamp = new Date();
    let expiryTime = new Date();
    let arrivalDate = new Date();

    arrivalDate.setTime( arrivalDate.getTime() + 3 * 86400000 );

    arrivalDate.setHours(0,0,0,0);

    expiryTime.setMinutes(expiryTime.getMinutes() + 60);

    let referenceId = "SampleReferenceId" + new Date().getTime();
    const eventJson = {

        "timestamp": timestamp.toISOString(),
        "referenceId": referenceId,
        "expiryTime": expiryTime.toISOString(),
        "event": {
          "name": "AMAZON.MessageAlert.Activated",
          "payload": {
            "state": {
              "status": "UNREAD",
              "freshness": "NEW"
            },
            "messageGroup": {
              "creator": {
                "name": "Twitter no mention"
              },
              "count": 3,
              "urgency": "URGENT"
            }
          }
        },
        "relevantAudience": {
            "type": "Unicast",
            "payload": {
                "user": userId
            }
        }
    };

    return eventJson;
}



// ----------------------------------------------------------------------------

function getTokenOptions(postLength){
    return {
        hostname: 'api.amazon.com',
        port: 443,
        path: '/auth/O2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postLength
        }
    }
}

function getTokenPostData() {
    return 'grant_type=client_credentials&client_id=' + clientID + '&client_secret=' + clientSecret + '&scope=alexa::proactive_events';
}

function getToken() {
    return new Promise(resolve => {
        const TokenPostData = getTokenPostData();
        const req = https.request(getTokenOptions(TokenPostData.length), (res) => {
            res.setEncoding('utf8');
            let returnData = '';

            res.on('data', (chunk) => { returnData += chunk; });

            res.on('end', () => {
                const tokenRequestId = res.headers['x-amzn-requestid'];
                resolve(JSON.parse(returnData).access_token);
            });
        });
        req.write(TokenPostData);
        req.end();

    });
}

// ----------------------------------------------------------------------------

function sendEvent(token, userId) {
    return new Promise(resolve => {

        const ProactivePostData = JSON.stringify(getProactivePostData(userId));

        const ProactiveOptions = getProactiveOptions(token, ProactivePostData.length);

        const req = https.request(ProactiveOptions, (res) => {
            res.setEncoding('utf8');

            if ([200, 202].includes(res.statusCode)) {
                console.log(res.headers);
            } else {
                console.log(`Error https response: ${res.statusCode}`);
                console.log(`requestId: ${res.headers['x-amzn-requestid']}`);

                if ([403].includes(res.statusCode)) {
                    console.log(`userId: ${userId}\nmay not have subscribed to this event.`)
                }
            }


            let returnData;
            res.on('data', (chunk) => { returnData += chunk; });

        });
        req.write(ProactivePostData);
        req.end();

    });

}
