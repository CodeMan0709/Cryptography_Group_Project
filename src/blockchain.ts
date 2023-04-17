const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const sha256 = require('crypto-js/sha256')


export class blockData{

   // public timestamp : string;
    public manufacturerID : string;
    public drugID : string;
    public drugName : string;
    public signature;

    constructor( manufacturerID : string , drugID : string , drugName : string ) {
        const date = new Date();
       // this.timestamp = date.toDateString() + " " + date.toTimeString();
        this.drugName = drugName;
        this.manufacturerID = manufacturerID;
        this.drugID = drugID;
        this.signature = '';
    }

    static calcHash(bd : blockData) : string{ 
        return sha256(JSON.stringify(bd.drugName) + bd.manufacturerID + bd.drugID).toString();
    }

    static signDrug(signingKey : any , bd : blockData){
        if(signingKey.getPublic('hex') !== bd.manufacturerID){
            throw new Error("ERROR : You can only sign drugs under your manufacturerID.");
        }
        const hash = blockData.calcHash(bd);
        const sig = signingKey.sign(hash , 'base64');
        bd.signature = sig.toDER('hex');
    }   

    static isValid(bd : blockData) : boolean{
        if(!bd)
            return true

        if(bd.drugName == "Genesis Block")
            return true;

        if (!bd.signature || bd.signature.length === 0 || bd.signature == "") 
            throw new Error('No signature provided');
        
        if(!bd.manufacturerID || !bd.drugID || !bd.drugName)
            return false;
        
        const publicKey = ec.keyFromPublic(bd.manufacturerID , 'hex');
        return publicKey.verify(blockData.calcHash(bd) , bd.signature);
    }
}

class Block{

    public timestamp : string;
    public nonce : number;
    public data : Array<blockData>;
    public hash : string;
    public prevHash : string;

    constructor(data : Array<blockData> , prevHash : string = ' '){
        const date = new Date();
        this.timestamp = date.toDateString() + " " + date.toTimeString();
        this.nonce = 0;
        this.data = data;
        this.hash = Block.calcHash(this);
        this.prevHash = prevHash;
    }

    static calcHash(block : Block) : string{
        return sha256(block.prevHash + JSON.stringify(block.data) + block.nonce).toString();
    }

    mineBlock(difficulty : number) : void{
        while(this.hash.substring(0 , difficulty) !== Array(1 + difficulty).join("0")){
            this.nonce++;
            this.hash = Block.calcHash(this);
        }
    }

    static hasValidData(block : Block) {
        for(const d of block.data)
            if(!blockData.isValid(d))
                return false;
        return true;
    }
}

export class Blockchain{

    public chain : Array<Block>; //CHECK LATER
    public difficulty : number;
    public pendingData : Array<blockData>;
    public blockSize : number;

    constructor(){
        this.chain = [this.createGenesis()];
        this.difficulty = 2;
        this.pendingData = [];
        this.blockSize = 3;
    }
    
    createGenesis() : Block{
        return new Block([new blockData("", "" , "Genesis Block")]);
    }

    getLatestBlock() : Block{
        return this.chain[this.chain.length - 1];
    }

    minePending() : void{ //createBlock()
        if(this.pendingData.length == this.blockSize){
            let block = new Block(this.pendingData);
            this.addBlock(block);
            console.log();
            console.log("Block mined successfully")
            console.log("Block Hash : ",block.hash);
            console.log("prevBlockHash : ",block.prevHash);
            console.log("Nonce : ",block.nonce);
            console.log();
            this.pendingData = []
        }
        else{
            console.log("Need more data before mining")
        }
    }

    getDrugs(id : string) : Array<string>{
        let drugList : Array<string> = [];
         
        this.chain.forEach(block => {
            block.data.forEach(blockData => {
                if(blockData.manufacturerID == id)
                    drugList.push(blockData.drugName)
            })
        })

        return drugList;
    }

    addData(data : blockData) : void{
        // add manu/drug id chk here and chk data validity
        if(blockData.isValid(data))
            this.pendingData.push(data)
    }

    addBlock(newBlock : Block) : void{
        newBlock.prevHash = this.getLatestBlock().hash;
        newBlock.mineBlock(this.difficulty)
        newBlock.hash = Block.calcHash(newBlock);
        this.chain.push(newBlock)
    }

    static isValid(bc : Blockchain) {
        for (let i = 1; i < bc.chain.length; i++) {
            const currentBlock = bc.chain[i];
            const prevBlock = bc.chain[i-1];

            if (
                currentBlock.hash !== Block.calcHash(currentBlock) || 
                prevBlock.hash !== currentBlock.prevHash || 
                !Block.hasValidData(currentBlock)
            ) {
                return false;
            }
        }

        return true;
    }
}

const drugChain = new Blockchain();


module.exports.Block = Block;
module.exports.Blockchain = Blockchain;
module.exports.blockData = blockData;
module.exports.drugChain = drugChain;
