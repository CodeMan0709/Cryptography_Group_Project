//This node does not mine, it exists only to send data to the frontend

const ws = require("ws");
const {Blockchain , blockData , drugChain, peerList} = require('../dist/blockchain.js');
const sha256 = require('crypto-js/sha256')
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const axios = require('axios');
const express = require('express');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let peers;

key = ec.genKeyPair();
id = key.getPublic('hex');
const manu_sign = ec.keyFromPrivate(id) //ea29bd9c1a35ef95b4afa163902a27d1ed2d1fe304a5035e1c6ce5df9d5ec09f
const manu_id = manu_sign.getPublic('hex')

const PORT = 3000 + Math.floor(Math.random()*100)
console.log("Listening on PORT" , PORT)

let my_address = `ws://localhost:${PORT}`

let data = JSON.stringify({
    "peerAddress": `ws://localhost:${PORT}`
  });


let getConfig = {
method: 'get',
maxBodyLength: Infinity,
url: 'http://localhost:8080/peerList',
headers: { 
    'Content-Type': 'application/json',
},
data : data
};

let postConfig = {
  method: 'post',
  url: 'http://localhost:8080/addPeer',
  headers: { 
    'Content-Type': 'application/json', 
  },
  data : data
};

axios.request(postConfig)
.then((response) => {
  console.log("Added as a Peer");
})
.catch((error) => {
  console.log(error);
});

server = new ws.Server({ port : PORT})
let opened = [] , connected = [];

if(server){
server.on("connection" , async (socket , req) => {

    socket.on("message" , message => {
        const _message = JSON.parse(message)

        switch(_message.type){
            case "CREATE_DRUG":
                const drugData = _message.data[0];
                console.log("Received Data from " ,_message.data[1] ," Pending Length : " , (drugChain.pendingData.length + 1))
               
                drugChain.addData(drugData)
                break;
            

            case "ADD_BLOCK":

                const newBlock = _message.data[0];
                const prevHash = newBlock.prevHash

                console.log("New Block Received from : ",_message.data[1])
                
                if(
                    (sha256(drugChain.getLatestBlock().hash + JSON.stringify(newBlock.data) + newBlock.nonce).toString() === newBlock.hash) &&
                    newBlock.hash.startsWith(Array(drugChain.difficulty + 1)) &&
                    newBlock.hasValidData(newBlock) || true &&
                    drugChain.getLatestBlock().hash === prevHash
                ){
                    const newBlock = _message.data;
                    drugChain.chain.push(newBlock);
                    drugChain.pendingData = [];
                    console.log("Block Added")
                }
                else if(drugChain.getLatestBlock().hash = newBlock.hash)
                    console.log("Block Not Added. The block is already present here")
                else if(drugChain.getLatestBlock().data === newBlock.data)
                    console.log("Block Not Added. The duplicate block data detected")
                else
                    console.log("Checks failed. Block was not added")
                break;
            
            case "SEND_CHAIN":
            
                console.log()
                console.log("Blocks received")
                console.log()
                const { block, finished } = _message.data;

                if (!finished)
                    tempChain.chain.push(block);
                else {
                    tempChain.chain.push(block);
                    if (Blockchain.isValid(tempChain)) 
                        drugChain.chain = tempChain.chain;
                    tempChain = new Blockchain();
                }

                break;

            case "REQUEST_CHAIN":

                console.log('A copy of the blockchain was requested')
                const socketToSend = opened.filter(node => node.address === _message.data)[0].socket;
                for (let i = 0; i < drugChain.chain.length; i++) {
                    socketToSend.send(JSON.stringify(produceMessage(
                        "SEND_CHAIN",
                        {
                            block: drugChain.chain[i],
                            finished: i === drugChain.chain.length - 1
                        }
                    )));
                }

                break;
            
            case "HANDSHAKE":

                const nodes = _message.data;
                nodes.forEach(node => connect(node))
        }
    })
}) 
}



let tempChain = new Blockchain()
tempChain.chain.pop();

async function interactWithChain(choice){
    switch(choice){
        case 0:
            console.log(peerList)
        case 1:

            await axios.request(getConfig)
            .then((response) => {
                peers = response.data
                peers.splice(peers.indexOf(my_address) , 1)
            })
            .catch((error) => {
                console.log(error);
            });

            console.log("Connecting to peers : ",peers)
            peers.forEach(peer => connect(peer));
            console.log()
            console.log("Connected to Peers")
            console.log()
        break;
        case 2:
            sendMessage(produceMessage("REQUEST_CHAIN" , my_address))
        break;
        case 3:
            console.log()
	        console.log(JSON.stringify(drugChain , null , 3))
            console.log()
        break;
        case 4:
            const rand = Math.floor(Math.random() * 100)
            const data1 = new blockData(manu_id , `Drug ID ${rand}` , `Drug Name ${rand}`);
            blockData.signDrug(manu_sign , data1)
            console.log(`Broadcasting --> Drug ID ${rand} Drug Name ${rand}`)
            sendMessage(produceMessage("CREATE_DRUG", [data1 , my_address]));
        break;
        case 99:
            if (drugChain.pendingData.length == drugChain.blockSize) {
                drugChain.minePending();
                console.log("Broadcasting block to other nodes.")
                sendMessage(produceMessage("ADD_BLOCK", [drugChain.getLatestBlock() , my_address]))
                break;
            }
            else{
                console.log("Listening.... Pending Data Length:",drugChain.pendingData.length)
            }
        break;
        default:
            flag = false
    }
}

async function connect(address) {
    if(!connected.find(peerAddress => peerAddress === address) && address != my_address){
        const socket = new ws(address);

        socket.on("open" , () => {
            socket.send(JSON.stringify(produceMessage("HANDSHAKE" , [my_address , ...connected])))
            
            opened.forEach(node => node.socket.send(JSON.stringify(produceMessage("HANDSHAKE" , [address]))))

            if (!opened.find(peer => peer.address === address) && address !== my_address) {
                opened.push({ socket, address });
            }

            if (!connected.find(peerAddress => peerAddress === address) && address !== my_address) {
                connected.push(address);
            }
        });

        socket.on("close", () => {
			opened.splice(connected.indexOf(address), 1);
			connected.splice(connected.indexOf(address), 1);
		});
    }
}

function produceMessage(type, data) {
	return { type, data };
}

function sendMessage(message) {
	opened.forEach(node => {
		node.socket.send(JSON.stringify(message));
	})
}

interactWithChain(1)

const app = express();

const portListener = 3000;

app.listen(portListener, () => {
    console.log(`API Running at http://localhost:${portListener}`);
});

app.get('/getChain' , (req , res) => {
    res.send(drugChain)
})
  