const https = require('https');
const core = require('@actions/core');

try {
    const organization = core.getInput('organization-key');
    const project = core.getInput('project-key');
    const path = `/api/project_analyses/search?organization=${organization}&project=${project}&catagory=QUALITY_GATE`;
    const defaultHostname = 'sonarcloud.io';
    const defaultPort = 443;

    let hostname = core.getInput('hostname', { required: false });
    let port = core.getInput('port', { required: false });
    if (hostname.length === 0) hostname = defaultHostname;
    if (port.length === 0) port = defaultPort;
    const requestInfo = {
        hostname: hostname,
        port: port,
        path: path,
        method: 'GET'
    }
    let body = []
    const req = https.request(requestInfo, res => {
        res.on('data', d => {
            body.push(d)
        }).on('end', () => {
            requestBody = Buffer.concat(body).toString();
            let sonar = JSON.parse(requestBody);
            let element = findNewGateStatus(sonar);
            let gateway = element.events.find((e) => e.category === 'QUALITY_GATE');
            console.log(`description: ${gateway.description}`);
            status = gateway.name.split(' ')[0];
            console.log(`status = ${status}`);
            if (status.toLocaleLowerCase() === "red") {
                core.setFailed("Not pass sonar gateway");
            }
        })
    })

    req.on('error', error => {
        console.error(error);
        core.setFailed(error.message);
    })
    req.end()

} catch (error) {
    core.setFailed(error.message);
}

function findNewGateStatus(json) {
    var tempTime = 0;
    var result;
    json.analyses.forEach(element => {
        var time = new Date(element.date).getTime();
        if (time > tempTime && element.events.length > 0 && element.events.find(e => e.category == 'QUALITY_GATE')) {
            result = element;
            tempTime = time;
        }
    });
    return result;
}