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

const manu_sign = ec.keyFromPrivate('ddd0b6e733f2dbc974468c0536616679591f70dae94ea97050efd70a4e383df5')
const manu_id = manu_sign.getPublic('hex')


let tempChain = new Blockchain()
tempChain.chain.pop();

const PORT = 3001;
const peers = ['ws://localhost:3000' , 'ws://localhost:3002' , 'ws://localhost:3003'];
const  my_address = `ws://localhost:${PORT}`

const server = new ws.Server({ port : PORT})

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

                const drugData = _message.data[0];
                console.log("Received Data from " ,_message.data[1] ," Pending Length : " , (drugChain.pendingData.length + 1))
               
                drugChain.addData(drugData)
                if(drugChain.pendingData.length == drugChain.blockSize){
                setTimeout(() => {
                    interactWithChain(99)
                },0) //To simulate some slow nodes, if necessary
            }
                break;
            

            case "ADD_BLOCK":

                //console.log(_message.data[0])

                const newBlock = _message.data[0];
                const prevHash = newBlock.prevHash

                console.log("New Block Received from : ",_message.data[1])
                
                if(
                    (sha256(drugChain.getLatestBlock().hash + JSON.stringify(newBlock.data) + newBlock.nonce).toString() === newBlock.hash) &&
                    newBlock.hash.startsWith(Array(drugChain.difficulty + 1)) &&
                    newBlock.hasValidData(newBlock) || true &&
                    drugChain.getLatestBlock().hash === prevHash //add timestamp check (gen chk also)
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

console.log("Manufacturer ID (Public Add) : ",manu_id)
console.log()
console.log("Connect to Peers            -> 1");
console.log("Request copy of blockchain  -> 2");
console.log('Show chain                  -> 3');
console.log('Add drug                    -> 4');
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
                console.log("Broadcasting block to other nodes.")
                sendMessage(produceMessage("ADD_BLOCK", [drugChain.getLatestBlock() , my_address]))
                break;
            }
            else{
                console.log("Listening.... Pending Data Length:",drugChain.pendingData.length)
            }
        break;
        case 3:
            console.log()
	        console.log(JSON.stringify(drugChain , null , 1))
            console.log()
        break;
        case 4:
            const rand = Math.floor(Math.random() * 100)
            const data1 = new blockData(manu_id , `Drug ID ${rand}` , `Drug Name ${rand}`);
            blockData.signDrug(manu_sign , data1)
            console.log(`Broadcasting --> Drug ID ${rand} Drug Name ${rand}`)
            sendMessage(produceMessage("CREATE_DRUG", [data1 , my_address]));
            drugChain.addData(data1)
                if(drugChain.pendingData.length == drugChain.blockSize){
                    drugChain.minePending()
                   sendMessage(produceMessage("ADD_BLOCK", [drugChain.getLatestBlock() , my_address]))
                }
                else
                    console.log("Listening.... Pending Data Length:",drugChain.pendingData.length)
        break;
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
  