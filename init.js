(function() {
    'use strict';

    const fs = require('fs');
    const readline = require('readline');
    const trello = require('node-trello');
    const opn = require('opn');
    const argv = require('minimist')(process.argv.slice(2));
    require('./core.js');

    const userhome = process.env.HOME || process.env.USERPROFILE;
    const publicKeyFile = userhome + '/.trello-public-token';
    const secretKeyFile = userhome + '/.trello-secret-token';
    const appTitle = 'trello-api-cli';

    var publicKey;
    var secretKey;

    console.error('Supported methods: ' + Object.keys(tsCore));

    try {
        publicKey = fs.readFileSync(publicKeyFile, 'utf8');
        if (publicKey !== undefined)
            publicKey = publicKey.trim();
        console.error('Public API key set to: ' + publicKey);
    } catch (err) {
        console.error('WARNING: Could not read ' + publicKeyFile + ' file. Create it and store your public api key inside.');
        return;
    }

    try {
        secretKey = fs.readFileSync(secretKeyFile, 'utf8');
        if (secretKey !== undefined)
            secretKey = secretKey.trim();
        console.error('Secret API key set to: ' + secretKey);
    } catch (err) {
        console.error('WARNING: Could not read ' + secretKeyFile +
            '. Will re-authenticate.');
    }

    if (secretKey === undefined) {
        var oauthUrl = 'https://trello.com/1/connect?key=' + publicKey +
            '&name=' + appTitle + '&response_type=token&scope=read,write';
        console.error('I will open a browser. After granting access to your trello, paste the provided API key here.');
        opn(oauthUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Your secret API key: ', (answer) => {
            secretKey = answer;
            fs.writeFileSync(secretKeyFile, secretKey + '\n');
            console.error('Secret API key set to: ' + secretKey);
            initiate();
            rl.close();
        });
    } else {
        initiate();
    }

    function initiate() {
        console.error('Initiating Trello API access..');
        const tc = new trello(publicKey, secretKey);
        tc.get('/1/members/me', function(err, data) {
            if (err) {
                console.error('ERROR: Probably broken authentication.');
                throw err;
            }
            if (data.username !== undefined && data.fullName !== undefined) {
                console.error('Successfully authenticated with user ' +
                    data.username + ' (' + data.fullName + ').')
                console.error('CMD-Line: ' + JSON.stringify(argv));
                if (argv._.length === 0) {
                    console.error('No method provided. Will exit.');
                    return;
                }
                var fn = argv._[0].toString().trim();
                console.error('Invoking function: ' + fn);
                try {
                    tsCore[fn](tc, argv);
                } catch (err) {
                    console.error('Cannot run method.');
                    throw err;
                }
            }
        });
    }
})()
