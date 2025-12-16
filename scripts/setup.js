const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("======================================");
console.log("     GGE Authenticator Setup");
console.log("======================================");

// -------------------------------
// 1. Create .env
// -------------------------------
const envPath = path.join(__dirname, "..", ".env");

if (!fs.existsSync(envPath)) {
  const envContent =
    `PORT=5000
DB_PORT=PORT_HERE
DB_NAME=DB_NAME_HERE
DB_USER=USER_HERE
DB_PASSWORD=PASSWORD_HERE

# MongoDB
MONGO_URI=MONGO_REPLICA_SET_URI_HERE
MONGO_DB_NAME=DB_NAME_HERE

# Redis
REDIS_HOST=REDIS_HOST_HERE
REDIS_PORT=REDIS_PORT_HERE
ACCESS_TOKEN_SECRET=SECRET_HERE
REFRESH_TOKEN_SECRET=SECRET_HERE
ACCESS_TOKEN_TTL=TTL_HERE
INTERNAL_SECRET=Your_Internal_Secret
`;

  fs.writeFileSync(envPath, envContent, "utf8");
  console.log("✔ Created .env file");
} else {
  console.log("✔ .env already exists");
}

// -------------------------------
// 2. Create db_config/config directory + config.json
// -------------------------------
const configDir = path.join(__dirname, "..", "db_config", "config");

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

const configFile = path.join(configDir, "config.json");

if (!fs.existsSync(configFile)) {
  const defaultConfig = {
    development: {
      username: "DEV_USER_HERE",
      password: "DEV_PASSWORD_HERE",
      database: "DEV_DB_HERE",
      host: "HOST_HERE",
      port: 5432,
      dialect: "postgres"
    },
    test: {
      username: "TEST_USER_HERE",
      password: "TEST_PASSWORD_HERE",
      database: "TEST_DB_HERE",
      host: "HOST_HERE",
      port: 5432,
      dialect: "postgres"
    },
    production: {
      username: "PROD_USER_HERE",
      password: "PROD_PASSWORD_HERE",
      database: "PROD_DB_HERE",
      host: "HOST_HERE",
      port: 5432,
      dialect: "postgres"
    }
  };

  fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
  console.log("✔ Created db_config/config/config.json");
} else {
  console.log("✔ config.json already exists");
}

// -------------------------------
// 3. Install dependencies
// -------------------------------
console.log("\nInstalling dependencies using npm ci...");
try {
  execSync("npm ci", { stdio: "inherit" });
  console.log("✔ Dependencies installed");
} catch (err) {
  console.error("✘ Failed to run npm ci. Please install manually.");
}

// -------------------------------
// 4. Final message
// -------------------------------
console.log("======================================");
console.log("   Setup Complete! 🎉");
console.log("======================================\n");

console.log("You can now edit:");
console.log("  - .env → update PORT / secrets");
console.log("  - config.json → update DB credentials\n");

console.log("Run the development server:");
console.log("  npm run dev\n");
