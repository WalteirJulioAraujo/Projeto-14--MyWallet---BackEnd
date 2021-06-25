import { afterAll, beforeEach, beforeAll } from '@jest/globals';
import { TestWatcher } from 'jest';
import supertest from 'supertest';
import app from '../src/app.js';
import connection from '../src/databaseConfig';
import bcrypt from 'bcrypt';

let hashPassword = "";

beforeAll( async ()=>{
    hashPassword = bcrypt.hashSync('123456',10);
    await connection.query(`
    INSERT INTO users (name,email,password)
    VALUES ('testjest','test@test.com.br',$1)
    `,[hashPassword]);
})

afterAll( async ()=>{
    await connection.query(`
    DELETE FROM users
    WHERE email = 'test@test.com.br'
    `);
    connection.end();
})

describe('POST /login', ()=>{
    it('return status 200 for valid params', async ()=>{
        const body = {email:'test@test.com.br',password: '123456'};
        const result = await supertest(app).post('/login').send(body);
        expect(result.status).toEqual(200);
    });
    it('return status 401 for invalid password', async ()=>{
        const body = {email:'test@test.com.br',password: '12345'};
        const result = await supertest(app).post('/login').send(body);
        expect(result.status).toEqual(401);
    });
    it('return status 401 for invalid email', async ()=>{
        const body = {email:'tes@test.com.br',password: '123456'};
        const result = await supertest(app).post('/login').send(body);
        expect(result.status).toEqual(401);
    });
    it('return status 500 if email wasnt send', async ()=>{
        const body = {email:'',password: '123456'};
        const result = await supertest(app).post('/login').send(body);
        expect(result.status).toEqual(500);
    })
    it('return status 500 if password wasnt send', async ()=>{
        const body = {email:'test@test.com.br',password: ''};
        const result = await supertest(app).post('/login').send(body);
        expect(result.status).toEqual(500);
    })
    it('return status 500 if email wasnt a email', async ()=>{
        const body = {email:'test.com.br',password: '123456'};
        const result = await supertest(app).post('/login').send(body);
        expect(result.status).toEqual(500);
    })
    it('return status 500 if password has 2 characters or less', async ()=>{
        const body = {email:'test@test.com.br',password: '23'};
        const result = await supertest(app).post('/login').send(body);
        expect(result.status).toEqual(500);
    })
})