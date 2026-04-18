const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wwse58h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let casesCollection;

async function run() {
    try {
        await client.connect();

        const db = client.db("casecloud");
        casesCollection = db.collection("cases");

        console.log("MongoDB Connected");
    } catch (err) {
        console.error(err);
    }
}

run();

// ------------------- ROUTES -------------------

// create case
app.post("/case", async (req, res) => {
    const result = await casesCollection.insertOne(req.body);
    res.send(result);
});

// get all cases
app.get("/cases", async (req, res) => {
    const result = await casesCollection.find().toArray();
    res.send(result);
});

// get single case
app.get("/case/:id", async (req, res) => {
    const id = req.params.id;
    const result = await casesCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
});

// update case
app.put("/case/:id", async (req, res) => {
    const id = req.params.id;

    const result = await casesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
    );

    res.send(result);
});

// delete case
app.delete("/case/:id", async (req, res) => {
    const id = req.params.id;

    const result = await casesCollection.deleteOne({
        _id: new ObjectId(id),
    });

    res.send(result);
});

// get by email
app.get('/cases/client/:email', async (req, res) => {
    const email = req.params.email;

    const result = await casesCollection
        .find({ "client.email": email })
        .toArray();

    res.send(result);
});

// update status
app.patch("/case-status/:id", async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    const result = await casesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
    );

    res.send(result);
});

app.get("/", (req, res) => {
    res.send("CaseCloud server running");
});

app.listen(5000, () => console.log("Server running on port 5000"));