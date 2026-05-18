import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import { stubUserMiddleware } from './middleware/stubUserMiddleware.js';
import Recipe from '../models/Recipe.js';
import Ingredient from '../models/Ingredient.js';

const app = express();
app.use(express.json());
app.use(stubUserMiddleware);

// health is used to make sure the application server is running, when we go to our website/health and if we see "ok" then it means its running
app.get('/health', (_,res) => res.json({ ok: true })); 

/*  eg: res.json(req.user) → response body is { "_id": "demo-user" } (the user object at the top level)
but, res.json({ user: req.user }) → response body is { "user": { "_id": "demo-user" } } (wrapped under a user key)
The wrapped version is slightly nicer because:

It's self-describing. The client sees response.user and knows what it is, rather than having to remember "this endpoint returns a user." */
app.get('/whoami',(req, res) => ({user: req.user}));

//MONGO_URI environment variable needs to be defined ?
try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Mongo connected');
    app.listen(process.env.PORT || 4000, () =>
        console.log(`API on http://localhost:${process.env.PORT || 4000}`)
    );
} catch (err) {
    console.error('Mongo connection failed:', err.message);
    process.exit(1);
}

