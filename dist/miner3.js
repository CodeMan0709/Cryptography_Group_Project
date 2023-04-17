const ws = require("ws");
const {Block ,Blockchain , blockData , drugChain} = require('./blockchain.js');
const sha256 = require('crypto-js/sha256')
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const manu3_sign = ec.keyFromPrivate('e21ed4667d4e879d537c8ad7685c15ee4d3db56191dd26a21d3663959f986614')
const manu3_id = manu3_sign.getPublic('hex')

let tempChain = new Blockchain()
tempChain.chain.pop();

const PORT = 3002;
const peers = ['ws://localhost:3000' , 'ws://localhost:3001'];
const  my_address = "ws://localhost:3002"

const server = new ws.Server({ port : 3002})

let opened = [] , connected = [];

console.log("Listening on PORT" , PORT)

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

server.on("connection" , async (socket , req) => {

    socket.on("message" , message => {
        const _message = JSON.parse(message)

        switch(_message.type){
            case "CREATE_DRUG":

                const drugData = _message.data;
                console.log("Received Data! Pending Length : " , (drugChain.pendingData.length + 1))
                drugChain.addData(drugData)
                if(drugChain.pendingData.length == drugChain.blockSize)
                    console.log("Mining Block!")
                    interactWithChain(99)
                break;
            
            
            
            case "ADD_BLOCK":

                const newBlock = _message.data;
                const prevHash = newBlock.prevHash
                const difficulty = drugChain.difficulty;
                
                if(
                    (sha256(drugChain.getLatestBlock().hash + JSON.stringify(newBlock.data) + newBlock.nonce).toString() === newBlock.hash) &&
                    newBlock.hash.startsWith(Array(drugChain.difficulty + 1)) &&
                    newBlock.hasValidData(newBlock) || true &&
                    drugChain.getLatestBlock().hash === prevHash //add timestamp check (gen chk also)
                ){
                    const newBlock = _message.data;
                    drugChain.chain.push(newBlock);
                }
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

console.log("Manufacturer ID (Public Add) : ",manu3_id)
console.log()
console.log("Connect to Peers            -> 1");
console.log("Request copy of blockchain  -> 2");
console.log('Show chain                  -> 3');
console.log('Add drug                    -> 4');
console.log('View drugs owned by a user  -> 5');
console.log()

function interactWithChain(choice){
    switch(choice){
        case 1:
            peers.forEach(peer => connect(peer));
            console.log()
            console.log("Connected to Peers")
            console.log()
        break;
        case 2:
            sendMessage(produceMessage("REQUEST_CHAIN" , my_address))
        break;
        case 99:
            if (drugChain.pendingData.length == drugChain.blockSize) {
                drugChain.minePending();
                sendMessage(produceMessage("ADD_BLOCK", drugChain.getLatestBlock()))
                break;
            }
            else{
                console.log("Listening....")
            }
        break;
        case 3:
            console.log()
	        console.log(JSON.stringify(drugChain , null , 1))
            console.log()
        break;
        case 4:
            const rand = Math.floor(Math.random() * 100)
            const data1 = new blockData(manu3_id , `Drug ID ${rand}` , `Drug Name ${rand}`);
            blockData.signDrug(manu3_sign , data1)
            console.log(`Broadcasting --> Drug ID ${rand} Drug Name ${rand}`)
            sendMessage(produceMessage("CREATE_DRUG", data1));
            drugChain.addData(data1)
                if(drugChain.pendingData.length == drugChain.blockSize){
                    console.log("Mining Block!")
                    drugChain.minePending()
                }
                else
                    console.log("Listening...")
        break;
        case 5:
        default:
            flag = false
    }
}

rl.on('line', (input) => {
    if (input === '1') {
      interactWithChain(1);
    } else if (input === '2') {
      interactWithChain(2);
    } else if (input === '3') {
      interactWithChain(3);
    } else if (input === '4') {
      interactWithChain(4);
    } else if (input === '5') {
      interactWithChain(5);
    } else {
      console.log('Invalid input');
    }
  });
  
