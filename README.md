# Running the test network

Run `npm install` , after cloning the repo

Run `npm run start`, to start the peerList

`cd` into the `dist` folder to run the nodes

Each terminal instance can be used to run a node in a randomly selected port,

Run `node miner.js` in multiple terminals

Run `node api.js` in another terminal. The API runs at port `3000` by default.

To view the blockchain: Make a `GET` request to `http://localhost:3000/getChain` to get a copy of the blockchain

Connect each node with its peers [Option `1` in the CLI] before interacting with the blockchain


# About

A beginner blockchain that uses WebSocket to let nodes communicate with each other. As of writing, this project lacks a lot of functionalities that are considered desirable on a public working blockchain.
