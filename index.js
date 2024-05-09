const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const PORT = 8000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.get("/test", (req, res) => {
    console.log({ req });
    res.send("Hello World");
});

const mergeChunks = async (fileName, totalChunks) => {
    const chunkDir = __dirname + "/chunks";
    const mergedFilePath = __dirname + "/merged_files";

    if (!fs.existsSync(mergedFilePath)) {
        fs.mkdirSync(mergeChunks);
    }

    const writeStream = fs.createWriteStream(`${mergedFilePath}/${fileName}`);
    for (let i = 0; i < totalChunks; i++) {
        const chunkFilePath = `${chunkDir}/${fileName}.part_${i}`;
        const chunkBuffer = await fs.promises.readFile(chunkFilePath);
        writeStream.write(chunkBuffer);
        fs.unlinkSync(chunkFilePath);
    }

    writeStream.end();
    console.log("Chunks merged successfully");
}

app.post("/upload", upload.single("file"), async (req, res) => {
    console.log("Hit");
    const chunk = req.file.buffer;
    const chunkNumber = Number(req.body.chunkNumber);
    const totalChunks = Number(req.body.totalChunks);
    const fileName = req.body.originalFilename;

    const chunkDir = __dirname + "/chunks";

    if (!fs.existsSync(chunkDir)) {
        fs.mkdirSync(chunkDir);
    }

    const chunkFilePath = `${chunkDir}/${fileName}.part_${chunkNumber}`;

    try {
        await fs.promises.writeFile(chunkFilePath, chunk);
        console.log(`Chunk ${chunkNumber}/${totalChunks} saved`);

        if (chunkNumber ===  totalChunks - 1) {
            await mergeChunks(fileName, totalChunks);
            console.log("File merged successfully");
        }

        res.status(200).json({ message: "Chunk uploaded successfully" });
    } catch (error) {
        console.error("Error saving chunk: ", error);
        res.status(500).json({ error: "Error saving chunk" });
    }
});

app.listen(PORT, () => {
    console.log(`Port listening on ${PORT}`);
});