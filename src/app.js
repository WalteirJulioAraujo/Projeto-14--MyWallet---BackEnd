import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.use(express.json());

app.get('/teste', (req,res)=>{
    res.send("Ok");
})

app.listen(4001,()=>{
    console.log('Running on port 4001')
});