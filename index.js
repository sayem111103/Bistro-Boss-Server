const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Bistro Boss");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.glhjkho.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyJWT = (req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }

  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({error:true, message:'unauthorized access'})
    }
    req.decoded = decoded; 
    next()
  })

}

async function run() {
  try {
    const menuCollection = client.db("BistroBoss").collection("menu");
    const reviewCollection = client.db("BistroBoss").collection("review");
    const cartsCollection = client.db("BistroBoss").collection("carts");
    const usersCollection = client.db("BistroBoss").collection("users");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET,{ expiresIn: "1h" });
      res.send({token});
    });

    const verifyAdmin =async(req, res, next)=>{
      const email = req.decoded.email;
      const query = {email: email}
      const user = await usersCollection.findOne(query);
      if(user?.role !== 'admin'){
        return res.status(403).send({error:true, message:'forbidden message'})
      }
      next()
    }


    app.get("/menu", async (req, res) => {
      const allMenu = await menuCollection.find().toArray();
      res.send(allMenu);
    });

    app.post('/menu', verifyJWT, verifyAdmin, async(req, res)=>{
      const menu = req.body;
      console.log(menu);
      const result = await menuCollection.insertOne(menu);
      res.send(result)
    })

    // users backend start
    app.post("/users", async (req, res) => {
      const users = req.body;
      const query = { email: users.email };
      const exist = await usersCollection.findOne(query);
      if (exist) {
        return res.send({ message: "already exist" });
      }
      const result = await usersCollection.insertOne(users);
      res.send(result);
    });

    app.get('/users/admin/:email',verifyJWT,async(req, res)=>{
      const email = req.params.email;
      const query = {email: email};
      if(req.decoded.email !== email){
        res.send({admin: false})
      }
      const user = await usersCollection.findOne(query);
      const result= {admin: user?.role === 'admin'}
      res.send(result)
    })

    app.patch("/users/:id",verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/users",verifyJWT, verifyAdmin, async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });
    // users backend end

    app.get("/review", async (req, res) => {
      const reviews = await reviewCollection.find().toArray();
      res.send(reviews);
    });

    // carts backend start
    app.post("/carts", async (req, res) => {
      const carts = req.body;
      const query = {email: carts.email};
      const admin = await usersCollection.findOne(query);
      console.log(admin);
      if(admin.role === 'admin'){
        return res.send({message: "admin can't add to cart"})
      }
      const result = await cartsCollection.insertOne(carts);
      res.send(result);
    });

    app.get("/carts",verifyJWT, async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }

      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }

      const query = { email: email };
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
      // const email = req.query.email;
      // const query = { email: email };
      // const result = await cartsCollection.find(query).toArray();
      // res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    });
    // carts backend end

    // app.get('/carts', async(req, res)=>{
    //   const carts = await cartsCollection.find().toArray()
    //   res.send(carts)
    // })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port);
