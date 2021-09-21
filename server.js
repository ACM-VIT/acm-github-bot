const { Server, Probot } = require('probot')
const app = require('./index')
const path  = require("path")

require('dotenv').config()
const { env } = process
const appId = env.APP_ID
const privateKey = env.PRIVATE_KEY
const secret = env.WEBHOOK_SECRET

const server = new Server({
  Probot: Probot.defaults({ appId, privateKey, secret })
})

server.expressApp.set('views', path.join(__dirname, 'public', 'views'))
server.expressApp.set('view engine', 'pug')
server.load(app)
server.start()