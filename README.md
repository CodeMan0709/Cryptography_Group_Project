
# DrugChain

DrugChain is a blockchain designed to keep track of valid/verified drugs. Each transaction in a block is a `Drug Name` - `Manufacturer ID Pair`.

By default, the blockchain has 3 transactions in each block and a set difficulty of 4
These parameters can be changed in the `src/blockchain.ts` file. Run `tsc` in the `src` directory after any changes.

The blockchain uses a Discrete Log ZKP to verify drugs. This is done as follows,

`p` is a large prime and `g` is its generator

A drug (with ID `x`) is sent to an trusted body for verification. After verifying the drug, `y = g^x mod(p)` is calculated and published.

When an external verifier wants to verify if a drug is legitimate, they should be able to do so without actually knowing the drug's unique ID.

To accomplish this, we use the following Zero Knowledge Proof,

 - A random number between `0` and `p - 1` is chosen and `h = g^x mod (p)` is calculated
 - `h` is sent to the verifier. The verifier then send a random bit `b` (0/1)
 - `s = (r + bx) mod(p - 1)` is calculated and sent to the verifier
 - The verifier checks if , `g^s mod (p)` equals `hy^b mod(p)`
 - This is done for multiple rounds (50 by default in our case). If the equality check fails once, then the drugID is not valid

Thus, we are able to verify a drugID without actually sending the drugID to the verifier

Note : In this repo, a list of randomly generated UUIDs is present in `validDrugIDs.txt` . For testing, only these drugIDs will pass the ZKP. This is not a security hazard as the file is not used anywhere in the project.


# Running the test network

Run `npm install` , after cloning the repo.

Run `npm run start`, to start the peerList.

`cd` into the `src` folder to run the nodes.

Each terminal instance can be used to run a node in a randomly selected port,

Run `node miner.js` in multiple terminals.

Run `node api.js` in another terminal. The API runs at port `3000` by default.

To view the blockchain: Make a `GET` request to `http://localhost:3000/getChain` to get a copy of the blockchain.

To open the frontend, `cd` into `frontend` and run `npm install` , the frontend will open on some open port by default.

Connect each node with its peers [Option `1` in the CLI] before interacting with the blockchain.


