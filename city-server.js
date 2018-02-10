let express = require("express")
let bodyParser = require("body-parser")
let Promise = this.Promise || require("bluebird")
let superagent = require("superagent")
let request = require("superagent-promise")(superagent, Promise)

let app = express()
app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})) // support encoded bodies

let os = require('os')
let cityInfo = {
  hostname: os.hostname(),
  type: os.type(),
  platform: os.platform(),
  release: os.release()
}

let argv = require("minimist")(process.argv.slice(2))
let {city} = argv

let cityPorts = {
  warsaw: 8080,
  berlin: 8081,
  amsterdam: 8082,
}
let port = cityPorts[city]

app.get("/health", (req, res) => {
  res.send({status: "UP", cityInfo: cityInfo})
})

app.post(`/api/${city}/receive`, (req, res) => {
  console.log(`SUCCESS - Receieved guest from ${req.body.from}`)
  res.status(200).send({cityInfo: cityInfo, city: city})
})

app.post(`/api/${city}/transit/to/:targetCity`, (req, res) => {
  let {targetCity} = req.params
  console.log(`PENDING - Transiting to ${targetCity}`)
  let targetCityPort = cityPorts[targetCity]
  request
    .post(`${targetCity}:${targetCityPort}/api/${targetCity}/receive`)
    .send({from: req.headers.host})
    .then(receiveResponse => {
      console.log(`SUCCESS - Transiting to ${targetCity}`)
      res.send({transit: {cityInfo: cityInfo, city: city}, targetCityInfo: receiveResponse.body})
    })
    .catch(err => {
      console.err(`ERROR - Transiting from ${req.headers.host} to ${targetCity}`)
      console.err(err)
      res.status(500).send(err)
    })
})

app.post(`/api/${city}/fly/to/:targetCity/through/:transitCity`, (req, res) => {
  let {targetCity, transitCity} = req.params

  let targetCityPort = cityPorts[targetCity],
    transitCityPort = cityPorts[transitCity]

  Promise.all(
    [
      request.get(`${targetCity}:${targetCityPort}/health`),
      request.get(`${transitCity}:${transitCityPort}/health`),
    ])
    .then(resolvedHealthChecks => {
      return request
        .post(`${targetCity}:${targetCityPort}/api/${targetCity}/transit/to/${transitCity}`)
    })
    .then(response => {
      console.log(response.body);
      res.send(response.body);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send({error: err})
    })

})

app.listen(port, () => {
  console.log(`${city} started on ${port}`)
})
