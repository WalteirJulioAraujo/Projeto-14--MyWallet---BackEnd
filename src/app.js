import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcrypt';
import joi from 'joi';
import { v4 as uuid } from uuid;

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

//Ao se cadastrar recebe {name,email,password};
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
        if(searchIfEmailAlreadyExist.rows.length){
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

//Ao tentar logar recebe { email, password };
app.post('/login', async (req,res)=>{

    const { email, password } = req.body;
    const Schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
    });
    const validate = Schema.validate({ email, password });
    if(validate.error){
        return res.sendStatus(500);
    }
    try{
        const searchUser = await connection.query(`
        SELECT * FROM users
        WHERE email=$1
        `,[email]);
        
        const user = searchUser.rows[0];
        const checkPassword = bcrypt.compareSync(password, user.password);
        if(user && checkPassword){
            //Antes tenho que ver se o user ja tem alguma session
            const searchIfAlreadyExistSession = await connection.query(`
            SELECT * FROM sessions
            WHERE "userId"=$1
            `,[user.id]);
            if(searchIfAlreadyExistSession.rows.length){
                await connection.query(`
                DELETE FROM sessions
                WHERE "userId"=$1
                `,[user.id]);
            }
            //vou ter que enviar para o front um token
            const token = uuid();
            await connection.query(`
            INSERT INTO sessions ("userId",token)
            VALUES ($1,$2)
            `,[user.id, token]);
            res.send(token);
            return;
        }else{
            return res.sendStatus(401);
        }

    }catch(error){
        console.log(error);
        return;
    }
})

app.listen(4001,()=>{
    console.log('Running on port 4001');
});



