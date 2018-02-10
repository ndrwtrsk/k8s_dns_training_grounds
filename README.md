# DNS funsies

Concept is easy. Create 3 services in nodejs, dockerize them, have them communicate with each other using DNS service.


## Assumptions
Three seperate docker images with applications running on different port depedning on the city chosen:

- warsaw: 8080
- berlin: 8081
- amsterdam: 8082

by `POST`ing
```
warsaw:8080/api/warsaw/fly/to/berlin/through/amsterdam
```

your request should be routed to berlin and then to amsterdam, making each subsequent call using DNS lookup.

In the end you should see info about transit city and target city like so:

```json
{
  "transit": {
    "cityInfo": {
      "hostname": "Andrews-MacBook-Pro.local",
      "type": "Darwin",
      "platform": "darwin",
      "release": "17.4.0"
    },
    "city": "berlin"
  },
  "targetCityInfo": {
    "cityInfo": {
      "hostname": "Andrews-MacBook-Pro.local",
      "type": "Darwin",
      "platform": "darwin",
      "release": "17.4.0"
    },
    "city": "amsterdam"
  }
}
```

## Create k8s stack
Simply `kubectl create -f k8s/stack.yaml`. This will create deployment for each of the cities along with, services, ingresses.

`curl -kL $(minikube ip)/amsterdam/health | jq '.'` and see if amsterdam is up. It will be.

## Executing

Issue `curl -X POST -kL $(minikube ip)/amsterdam/api/amsterdam/fly/to/berlin/through/warsaw | jq '.'`

and Voilà!
```
{
  "transit": {
    "cityInfo": {
      "hostname": "berlin-756c79756d-m6nl4",
      "type": "Linux",
      "platform": "linux",
      "release": "4.9.13"
    },
    "city": "berlin"
  },
  "targetCityInfo": {
    "cityInfo": {
      "hostname": "warsaw-7899cd444b-2xmjn",
      "type": "Linux",
      "platform": "linux",
      "release": "4.9.13"
    },
    "city": "warsaw"
  }
}
```

Everything worked as intended.

## What have I learned:

1. You can use `ENTRYPOINT` in docker to provide a commant that will be executed on container if there was no `--exec` provided.
1. You may also provied `CMD` to execute something further. You may also use it to passs default parameters to `ENTRYPOINT`.
1. You may override both `CMD` in deployment image specification like so:
    ```
        spec:
          containers:
            - name: warsaw
              image: ndrw/city:1.0.0
              args: ["warsaw"]
    ```
    now `"warsaw"` argument will be passed to image `ENTRYPOINT`.
    and since my `ENTRYPOINT` is `ENTRYPOINT ["node", "city-server.js", "--city"]` the server will be launched with following configuration:
    ```
    node city-server.js --city warsaw
    ```
    isn't this just great?
1. You may also override `ENTRYPOINT` in spec like so:
    ```
    apiVersion: v1
    kind: Pod
    metadata:
      name: command-demo
      labels:
        purpose: demonstrate-command
    spec:
      containers:
      - name: command-demo-container
        image: debian
        command: ["printenv"]
        args: ["HOSTNAME", "KUBERNETES_PORT"]
      restartPolicy: OnFailure
    ```
1. Iterate over directories matching regex and install express in them or do just about anything inside them.
    ```bash
    for dir in ./node_*;
    do
        cd $dir
        npm install express --save
        cd ..
    done
    ```

1. `require('os')` contains all kind of interesting data about system from node process' point of view