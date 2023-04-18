import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
const bodyParser = require('body-parser')


dotenv.config();

const app: Express = express();
const port = 8080;
const peerList : Array<string> = []

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.post('/addPeer' , (req : Request , res : Response) => {
  console.log(req.body)
  peerList.push(req.body.peerAddress)
  console.log("Peer added at port : ",req.body.peerAddress)
  res.send()
})

app.get('/peerList', (req: Request, res: Response) => {
  res.send(peerList)
});

app.listen(port, () => {
  console.log(`Running at http://localhost:${port}`);
});
