const ws = require("ws");
const {Blockchain , blockData , drugChain, peerList} = require('../dist/blockchain.js');
const sha256 = require('crypto-js/sha256')
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const axios = require('axios');
const readline = require('readline');
const prompt = require('prompt-sync')();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let peers;

key = ec.genKeyPair();
id = key.getPublic('hex');
const manu_sign = ec.keyFromPrivate(id)
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

function zkpSendS(b){
    s = modExp((r + b*x) , 1n , (p - 1n))
    return s;
}
module.exports.zkpSendS = zkpSendS;

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

                if(drugChain.pendingData.length == drugChain.blockSize){
                    startMining()
                }

                // if(drugChain.pendingData.length == drugChain.blockSize){
                //     let secs = Math.floor(Math.random()*10)
                //     console.log("Mining in ",secs)
                //     setTimeout(() => {
                //         startMining()
                //     },secs*1000) //To simulate some slow nodes, if necessary
                // }
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
        const drug_name = prompt('Enter Drug Name : ');
        const drug_id = prompt('Enter Drug ID : ');
        const data1 = new blockData(manu_id , `${drug_id}` , `${drug_name}`);

        blockData.signData(manu_sign , data1)
        
        console.log('\nVerifying Drug with ZKP')
        const zkpVerify = require('./drugVerify.js').zkpVerify
        
        let flag = true;

        for(let i = 0 ; i < 50 ; i++){
            zkpSet(drug_id)
            if(zkpVerify(p , g , h) === false){
                console.log('\nZKP Verification Failed. Drug ID Invalid')
                flag = false
                break;
            }
        }

        if(flag){
            console.log('ZKP Verification Successful\n')

            console.log(`Broadcasting --> Drug ID ${drug_id} Drug Name ${drug_name}`)
            sendMessage(produceMessage("CREATE_DRUG", [data1 , my_address]));
            drugChain.addData(data1)
                if(drugChain.pendingData.length == drugChain.blockSize){
                    startMining()
                }
                else
                    console.log("Listening.... Pending Data Length:",drugChain.pendingData.length)
        }

        break;

        default:
            console.log('Invalid Input')
    }
}

function startMining(){
    if (drugChain.pendingData.length == drugChain.blockSize) {
        drugChain.minePending();
        console.log("Broadcasting block to other nodes.")
        sendMessage(produceMessage("ADD_BLOCK", [drugChain.getLatestBlock() , my_address]))
    }
    else{
        console.log("Listening.... Pending Data Length:",drugChain.pendingData.length)
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


console.log("Manufacturer ID (Public Add) : ",manu_id)
console.log()
console.log("Create Miner                -> 0");
console.log("Connect to Peers            -> 1");
console.log("Request copy of blockchain  -> 2");
console.log('Show chain                  -> 3');
console.log('Add drug                    -> 4');
console.log('Show drugs owned by a user  -> 5');
console.log()


rl.on('line', (input) => {
    interactWithChain(parseInt(input))
});


let p = 8710351092170399568734017n

let g = 38635475621555899789n

let x = 0n
let y = 0n
let r = 0n
let h = 0n

function zkpSet(x1){
    x = uuidToBigInt(x1)
    y = modExp(g ,x , p)
    r = randBigInt2(p)
    h = modExp(g , r , p)
}

const uuidToBigInt = (str) => {
    let newStr = str.replace(/-/g, "");
    newStr = "0x" + newStr
    return(BigInt(newStr))
}

const modExp = function (a, b, n) {
    a %= n;
    var rslt = 1n , x = a , lsb;
    while (b > 0) {
        lsb = b % 2n;
        b = b / 2n;
        if (lsb == 1n) {
            rslt = rslt * x;
            rslt = rslt % n;
        }
        x *= x ;
        x %= n;
    }
    return rslt;
};

function randBigInt2(range) {
    var rand = [], digits = range.toString().length / 9 + 2 | 0;
    while (digits--) { 
        rand.push(("" + (Math.random() * 1000000000 | 0)).padStart(9, "0"));
    }
    return BigInt(rand.join("")) % range;
}