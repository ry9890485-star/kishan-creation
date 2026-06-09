require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function createAdmin() {

    await mongoose.connect(process.env.MONGODB_URI);

    const hash = await bcrypt.hash("kishan@12345", 12);

    await mongoose.connection.collection("users").updateOne(
        { role: "admin" },
        {
            $set: {
                role: "admin",
                name: "Kishan Creation Admin",
                email: "kishancreation@gmail.com",
                password: hash
            }
        },
        { upsert: true }
    );

    console.log("Admin updated successfully!");
    process.exit(0);
}

createAdmin();