import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import joi from 'joi';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import connection from './databaseConfig.js';

const app = express();
app.use(cors());
app.use(express.json());


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
        return res.sendStatus(500);
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
            res.send({ name: user.name, token });
            return;
        }else{
            return res.sendStatus(401);
        }

    }catch(error){
        console.log(error);
        return res.sendStatus(500);
    }
})

//Ao tentar registrar uam transação recebe { name, value, type }
app.post('/inout', async (req,res)=>{
    //Iremos receber do Front o token
    const authorization = req.headers['authorization'];
    const token = authorization?.replace('Bearer ', '');
    if(!token) return res.sendStatus(401);
    //
    const { name, value, type, dateNow } = req.body;
    const Schema = joi.object({
        name: joi.string().required(),
        value: joi.number().required(),
        type: joi.boolean().required(),
        dateNow: joi.number().required()
    });
    const validate = Schema.validate({ name, value, type, dateNow });
    if(validate.error){
        console.log(validate.error);
        return res.sendStatus(500);
    }
    try{
        const searchUser = await connection.query(`
        SELECT * FROM sessions
        WHERE token=$1
        `,[token]);
        if(!searchUser.rows.length){
            return res.sendStatus(401);
        }
        const user = searchUser.rows[0];
        const date = dayjs().format('YYYY-MM-DD');
        await connection.query(`
        INSERT INTO transactions
        ("userId",date,name,value,type,datenow)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,[user["userId"],date,name,value,type,dateNow]);
        res.sendStatus(201);
    }catch(error){
        console.log(error);
        return res.sendStatus(500);
    }
})

//Front pede todas as transações, enviar tudo do usuario
app.get('/inout', async (req,res)=>{
    //Iremos receber do Front o token
    const authorization = req.headers['authorization'];
    const token = authorization?.replace('Bearer ', '');
    if(!token) return res.sendStatus(401);
    //  
    try{
        const searchUser = await connection.query(`
        SELECT * FROM sessions
        WHERE token=$1
        `,[token]);
        if(!searchUser.rows.length){
            return res.sendStatus(401);
        }
        const user = searchUser.rows[0];
        const transactions = await connection.query(`
        SELECT * FROM transactions
        WHERE "userId" = $1
        ORDER BY date
        `,[user.userId]);

        let total = 0;
        transactions.rows.map((e)=>{
            e.type?total+=e.value:total-=e.value;
        })
        res.send({data:transactions.rows,total});
    }catch(error){
        console.log(error);
        return res.sendStatus(500);
    }
});

app.post('/deleteTransaction', async (req,res)=>{

    const authorization = req.headers['authorization'];
    const token = authorization?.replace('Bearer ', '');
    if(!token) return res.sendStatus(401);

    const { date, name, value, type, datenow } = req.body;
    const Schema = joi.object({
        date: joi.date().required(),
        name: joi.string().required(),
        value: joi.number().required(),
        type: joi.boolean().required(),
        datenow: joi.number().required()
    });
    const validate = Schema.validate({ date, name, value, type, datenow });
    if(validate.error){
        console.log(validate.error);
        return res.sendStatus(500);
    } 
    try{
        const searchUser = await connection.query(`
        SELECT * FROM sessions
        WHERE token=$1
        `,[token]);
        if(!searchUser.rows.length){
            return res.sendStatus(401);
        }
        const user = searchUser.rows[0];
        await connection.query(`
        DELETE FROM transactions
        WHERE "userId" = $1 AND date = $2 AND name = $3 AND value = $4 AND type = $5 AND datenow = $6
        `,[user.userId, date, name, value, type, datenow]);
        res.sendStatus(200);
    }catch(error){
        console.log(error);
        return res.sendStatus(500);
    }  
})


export default app;