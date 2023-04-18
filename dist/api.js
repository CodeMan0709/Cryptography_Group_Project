"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const bodyParser = require('body-parser');
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = 8080;
const peerList = [];
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.send('Express + TypeScript Server');
});
app.post('/addPeer', (req, res) => {
    console.log(req.body);
    peerList.push(req.body.peerAddress);
    console.log("Peer added at port : ", req.body.peerAddress);
    res.send();
});
app.get('/peerList', (req, res) => {
    res.send(peerList);
});
app.listen(port, () => {
    console.log(`Running at http://localhost:${port}`);
});
