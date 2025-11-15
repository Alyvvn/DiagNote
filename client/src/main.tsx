import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { seedDemoData } from "./lib/seed-data";

seedDemoData().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
