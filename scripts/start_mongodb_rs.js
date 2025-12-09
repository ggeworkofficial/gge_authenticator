const { execSync, spawn } = require("child_process");

const dbPath = "C:\\Program Files\\MongoDB\\Server\\8.2\\data";
const mongodPath = "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe";
const replSetName = "rs0";

function killMongo() {
    try {
        console.log("🔪 Killing any running MongoDB processes...");
        execSync(`taskkill /F /IM mongod.exe`, { stdio: "ignore" });
        console.log("✅ MongoDB processes killed.");
    } catch (e) {
        console.log("No MongoDB processes found.");
    }
}

function startReplicaSet() {
    console.log("🚀 Starting MongoDB replica set...");
    const command =
        `"${mongodPath}" --dbpath "${dbPath}" --replSet ${replSetName} --port 27017`;

    // Use spawn with shell:true so Windows executes the quoted program correctly
    const mongo = spawn(command, {
        stdio: "inherit",
        shell: true
    });

    mongo.on("close", (code) => {
        console.log(`MongoDB exited with code ${code}`);
    });
}

killMongo();
startReplicaSet();
