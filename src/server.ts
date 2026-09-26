import { app } from "./app";

const PORT = process.env.PORT || 50002;

const startAp = async () => {
  try {
    app.listen(PORT, () => console.log("__ Server START on PORT:", PORT));
  } catch (e) {
    console.error("__ Some erros __");
    process.exit(1);
  }
};

startAp();
