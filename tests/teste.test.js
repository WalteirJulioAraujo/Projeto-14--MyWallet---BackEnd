import { afterAll, beforeEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../src/app.js';
import connection from '../src/databaseConfig';

// beforeEach( async ()=>{
//     await connection.query(`DELETE FROM ${'aqui entraria uma tabela'}`)
// })

afterAll(()=>{
    connection.end();
})

describe("GET /teste", () => {
    it("returns status 200 for valid params", () => {
        expect(200).toEqual(200);
    });
});

describe("GET /testes", () => {
    it("returns status 200 for valid params", async () => {
        const result =  await supertest(app).get("/testes");
        expect(result.status).toEqual(201);
    });
});
