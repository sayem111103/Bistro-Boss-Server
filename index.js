const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res)=> {
    res.send('Welcome to Bistro Boss')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.glhjkho.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const menuCollection = client.db('BistroBoss').collection('menu');
    const reviewCollection = client.db('BistroBoss').collection('review');
    const cartsCollection = client.db('BistroBoss').collection('carts');

    app.get('/menu', async(req, res)=>{
        const allMenu = await menuCollection.find().toArray();
        res.send(allMenu)
    })

    app.get('/review', async(req, res)=>{
      const reviews = await reviewCollection.find().toArray();
      res.send(reviews)
    })

    app.post('/carts', async(req, res)=>{
      const carts = req.body;
      const result = await cartsCollection.insertOne(carts);
      res.send(result)
    })

    app.get('/carts', async(req, res)=>{
      const email = req.query.email;
      const query = {email: email};
      const result = await cartsCollection.find(query).toArray();
      res.send(result)
    })

    app.delete('/carts/:id', async(req, res)=>{
      const id = req.params.id;
      console.log(id);
      const query = {_id: new ObjectId(id)};
      const result = await cartsCollection.deleteOne(query);
      res.send(result)
    })

    // app.get('/carts', async(req, res)=>{
    //   const carts = await cartsCollection.find().toArray()
    //   res.send(carts)
    // })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port);