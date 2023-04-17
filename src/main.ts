const {Blockchain , blockData} = require('./blockchain.js')
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

let bc = new Blockchain()

const manu1_sign = ec.keyFromPrivate('7c2c539108f6207905296e9799b78e6c24e4477f28c1748b1d6e139143137e1b')
const manu1_id = manu1_sign.getPublic('hex')

const data1 = new blockData(manu1_id , "Drug 1 ID" , "Drug 1 Name");
blockData.signDrug(manu1_sign , data1)
bc.addData(data1)

bc.minePending()

const data2 = new blockData(manu1_id , "Drug 2 ID" , "Drug 2 Name");
blockData.signDrug(manu1_sign , data2)
bc.addData(data2)

bc.minePending()

console.log()
console.log()

console.log(JSON.stringify(bc , null , 4))

const data3 = new blockData(manu1_id , "Drug 3 ID" , "Drug 3 Name");
blockData.signDrug(manu1_sign , data3)
bc.addData(data3)

bc.minePending()

const manu2_sign = ec.keyFromPrivate('b5a6f40714142eb974163db6ae96265758bcdd66c0bac73110d6870870ba226c')
const manu2_id = manu2_sign.getPublic('hex')

const data4 = new blockData(manu2_id , "Drug 4 ID" , "Drug 4 Name");
blockData.signDrug(manu2_sign , data4)
bc.addData(data4)

bc.minePending()

console.log()
console.log()

console.log(JSON.stringify(bc , null , 4))

console.log()

console.log(bc.getDrugs(manu1_id))
console.log(bc.getDrugs(manu2_id))