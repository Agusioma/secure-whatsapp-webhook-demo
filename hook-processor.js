const express = require('express')
var bodyParser = require('body-parser');
const next = require('next')
const crypto = require('crypto')
const xhub = require('express-x-hub');
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

var token = process.env.TOKEN || 'token';
var received_updates = [];

app.prepare()
    .then(() => {
        const server = express()

        server.set('port', (process.env.PORT || 5000));
        server.listen(server.get('port'));

        server.use(xhub({ algorithm: 'sha1', secret: process.env.APP_SECRET }));
        server.use(bodyParser.json());

        /* server.get('*', (req, res) => {
             return handle(req, res)
         })*/

        server.get('/check', function (req, res) {
            console.log(req);
            res.send('<pre>' + JSON.stringify(received_updates, null, 2) + '</pre>');
        });

        server.get('/safehook', function (req, res) {
            if (
                req.query['hub.mode'] == 'subscribe' &&
                req.query['hub.verify_token'] == token
            ) {
                res.send(req.query['hub.challenge']);
            } else {
                res.sendStatus(400);
            }
        });

        server.post('/safehook', function (req, res) {
            if (req.isXHubValid()) {
                console.log('\nValid X-Hub-Signature header. Proceeding...');

                /*
                    Removing the prepended shas56= string
                */

                const xHubSignature = req.headers["x-hub-signature-256"].substring(7);

                //Displaying to the user

                console.log("\n**************************************************************************")
                console.log("\n THE X-HUB-SIGNATURE HEADER:\n")
                console.log(xHubSignature)
                console.log("\nOUR GENERATED HEADER:\n")
                const requestBody = JSON.stringify(req.body)

                const generatedHeader = crypto
                    .createHmac('sha256', process.env.APP_SECRET)
                    .update(requestBody, 'utf-8')
                    .digest("hex")

                console.log(generatedHeader)
                console.log("\n**************************************************************************\n")

                if (generatedHeader == xHubSignature) {
                    // Adding the messages received
                    console.log('Message source verified. Proceeding to add this message:\n');

                    console.log(requestBody)

                    received_updates.unshift(req.body);
                    res.sendStatus(200);
                } else {
                    console.log('An unverified message source. Aborting.\n');
                    res.sendStatus(401);
                }
                return;
            } else {
                console.log('Invalid X-Hub-Signature header. Aborting.\n');
                res.sendStatus(401);
            }

        });

        server.listen()
    })
    .catch((ex) => {
        console.error(ex.stack)
        process.exit(1)
    })