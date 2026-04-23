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

const STATIC_ADMIN = {
    name: "CaseCloud Admin",
    email: "admin@casecloud.com",
    photo: "",
    role: "admin",
    approvalStatus: "approved",
};

let casesCollection;
let usersCollection;

async function run() {
    try {
        await client.connect();

        const db = client.db("casecloud");
        casesCollection = db.collection("cases");
        usersCollection = db.collection("users");

        await usersCollection.updateOne(
            { email: STATIC_ADMIN.email },
            {
                $set: {
                    ...STATIC_ADMIN,
                    updatedAt: new Date().toISOString(),
                },
                $setOnInsert: {
                    createdAt: new Date().toISOString(),
                },
            },
            { upsert: true }
        );

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

// create or update user profile
app.post("/users", async (req, res) => {
    const { email, ...rest } = req.body;

    if (!email) {
        return res.status(400).send({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase();
    const nextRole =
        normalizedEmail === STATIC_ADMIN.email ? "admin" : rest.role || "client";
    const nextApprovalStatus =
        nextRole === "lawyer"
            ? rest.approvalStatus || "pending"
            : nextRole === "admin"
                ? "approved"
                : rest.approvalStatus || "approved";

    const result = await usersCollection.updateOne(
        { email: normalizedEmail },
        {
            $set: {
                email: normalizedEmail,
                ...rest,
                role: nextRole,
                approvalStatus: nextApprovalStatus,
                updatedAt: new Date().toISOString(),
            },
            $setOnInsert: {
                createdAt: new Date().toISOString(),
            },
        },
        { upsert: true }
    );

    res.send(result);
});

// get user profile by email
app.get("/users/:email", async (req, res) => {
    const email = req.params.email.toLowerCase();
    const result = await usersCollection.findOne({ email });
    res.send(result || null);
});

// get all users
app.get("/users", async (req, res) => {
    const result = await usersCollection.find().toArray();
    res.send(result);
});

// update user role
app.patch("/users/role/:email", async (req, res) => {
    const email = req.params.email.toLowerCase();
    const { role } = req.body;

    if (!role) {
        return res.status(400).send({ message: "Role is required" });
    }

    const approvalStatus =
        role === "lawyer" ? "pending" : role === "admin" ? "approved" : "approved";

    const result = await usersCollection.updateOne(
        { email },
        {
            $set: {
                role,
                approvalStatus,
                updatedAt: new Date().toISOString(),
            },
        }
    );

    res.send(result);
});

// approve or reject lawyer profile
app.patch("/users/approval/:email", async (req, res) => {
    const email = req.params.email.toLowerCase();
    const { approvalStatus } = req.body;

    if (!approvalStatus) {
        return res.status(400).send({ message: "Approval status is required" });
    }

    const result = await usersCollection.updateOne(
        { email },
        {
            $set: {
                approvalStatus,
                updatedAt: new Date().toISOString(),
            },
        }
    );

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
    try {
        const id = req.params.id;
        const { _id, ...safePayload } = req.body || {};

        const result = await casesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: safePayload }
        );

        res.send(result);
    } catch (error) {
        res.status(500).send({
            message: "Failed to update case.",
            error: error.message,
        });
    }
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
