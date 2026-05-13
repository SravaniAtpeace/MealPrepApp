import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';

const app = express();
app.use(express.json());

// health is used to make sure the application server is running, when we go to our website/health and if we see "ok" then it means its running
app.get('/health', (_,res) => res.json({ ok: true })); 

//MONGO_URI environment variable needs to be defined ?
await mongoose.connect(process.env.MONGO_URI);
app.listen(process.env.PORT || 4000);
