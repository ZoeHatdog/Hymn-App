import "dotenv/config";
import { createApp } from "./app.js";
import { config } from "./config.js";

const app = createApp();

app.listen(config.port, config.host, () => {
  console.log(`Hymn web app running at http://localhost:${config.port}`);
});
