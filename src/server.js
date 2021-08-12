import "./setup.js";
import app from "./app.js";

const port = process.env.PORT;

app.listen(port,()=>{
    console.log(`Running on port ${port}`);
});