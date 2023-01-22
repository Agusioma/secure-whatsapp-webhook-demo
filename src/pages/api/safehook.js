// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const bodyParser = require('body-parser');
const next = require('next')
const crypto = require('crypto')

let app_token = process.env.TOKEN
let app_secret = process.env.APP_SECRET

export default function handler(req, res) {

  if (req.method === 'GET') {
    if (
      req.query['hub.mode'] == 'subscribe' &&
      req.query['hub.verify_token'] == app_token
    ) {
      res.send(req.query['hub.challenge']);
    }
  } else if (req.method === 'POST') {

    //Removing the prepended 'sha256=' string
    const xHubSignature = req.headers["x-hub-signature-256"].substring(7);

    //Displaying to the user
    console.log("\n**************************************************************************")
    console.log("\n THE X-HUB-SIGNATURE HEADER:\n")
    console.log(xHubSignature)
    console.log("\nOUR GENERATED HEADER:\n")

    const requestBody = JSON.stringify(req.body)
    const generatedHeader = crypto
      .createHmac('sha256', app_secret)
      .update(requestBody, 'utf-8')
      .digest("hex")

    console.log(generatedHeader)
    console.log("\n**************************************************************************\n")

    if (generatedHeader == xHubSignature) {
      // Adding the messages received
      console.log('Message source verified. This is the message:\n');
      console.log(requestBody)
    } else {
      console.log('An unverified message source. Aborting.\n');
    }
  }
}
