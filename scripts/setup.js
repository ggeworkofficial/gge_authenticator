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
  fs.writeFileSync(envPath, "PORT=5000\n", "utf8");
  console.log("✔ Created .env file");
} else {
  console.log("✔ .env already exists");
}

// -------------------------------
// 2. Create db_config/config directory
// -------------------------------
const configDir = path.join(__dirname, "..", "db_config", "config");

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

const configFile = path.join(configDir, "config.json");

if (!fs.existsSync(configFile)) {
  const defaultConfig = {
    development: {
      username: "YOUR_DB_USERNAME",
      password: "YOUR_DB_PASSWORD",
      database: "gge_auth",
      host: "localhost",
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
// 4. Final instructions
// -------------------------------
console.log("======================================");
console.log("   Setup Complete! 🎉");
console.log("======================================\n");

console.log("You can now edit:");
console.log("  - .env → update PORT or add secrets");
console.log("  - db_config/config/config.json → set PostgreSQL credentials\n");

console.log("Run the development server:");
console.log("  npm run dev\n");
