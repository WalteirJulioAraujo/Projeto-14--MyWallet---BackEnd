import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcrypt';
import joi from 'joi'

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;
const databaseConfig = {
    user:'postgres',
    password:'1234567',
    host:'localhost',
    port:5432,
    database:'mywallet'
}
const connection = new Pool(databaseConfig);

//Ao se cadastrar envia {name,email,password};
app.post('/signup', async (req,res)=>{

    const { name, email, password } = req.body;
    const Schema = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().required()
    });
    const validate = Schema.validate({name,email,password});
    if(validate.error){
        return res.sendStatus(500);
    }

    const passwordHash = bcrypt.hashSync(password,10);
    try{
        const searchIfEmailAlreadyExist = await connection.query(`
        SELECT * FROM users
        WHERE email=$1
        `,[email]);
        if(searchIfEmailAlreadyExist){
            return res.sendStatus(409);
        }
        await connection.query(`
        INSERT INTO users
        (name, email, password)
        VALUES ($1,$2,$3)
        `,[name,email,passwordHash]);
        res.sendStatus(201);
    }catch(error){
        console.log(error);
        res.sendStatus(501);
    }
    
})

app.listen(4001,()=>{
    console.log('Running on port 4001');
});



