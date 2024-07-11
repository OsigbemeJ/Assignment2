require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup Multer for File Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Single File Upload
app.route("/upload")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "views", "upload.html"));
  })
  .post(upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    res.send(`File uploaded successfully: ${req.file.path}`);
  });

// Multiple Files Upload
app.route("/upload-multiple")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "views", "upload-multiple.html"));
  })
  .post(upload.array("files", 15), (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }
    const filePaths = req.files.map((file) => file.path);
    res.status(200).send(`Files uploaded successfully: ${filePaths.join(", ")}`);
  });

// Fetch Single Random Image
app.get("/fetch-single", (req, res) => {
  let upload_dir = path.join(__dirname, "uploads");
  let uploads = fs.readdirSync(upload_dir);
  if (uploads.length == 0) {
    return res.status(503).send({
      message: "No images"
    });
  }
  let max = uploads.length - 1;
  let min = 0;
  let index = Math.round(Math.random() * (max - min) + min);
  let randomImage = uploads[index];
  res.sendFile(path.join(upload_dir, randomImage));
});

// Gallery Pagination
app.get("/fetch-all/pages/:index", (req, res) => {
  const ITEMS_PER_PAGE = parseInt(req.query.items_per_page || 10);
  const pageIndex = parseInt(req.params.index);
  if (isNaN(pageIndex) || pageIndex < 1) {
    return res.status(400).send("Invalid page index.");
  }
  const allFiles = Object.entries(getAllFiles());
  const totalItems = allFiles.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (pageIndex > totalPages) {
    return res.status(404).send("Page not found.");
  }
  const startIndex = (pageIndex - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pageItems = allFiles.slice(startIndex, endIndex);
  const response = {
    page: pageIndex,
    totalPages: totalPages,
    files: Object.fromEntries(pageItems)
  };
  res.json(response);
});

const getAllFiles = () => {
  const directoryPath = path.join(__dirname, "uploads");
  const files = fs.readdirSync(directoryPath);
  const fileContents = {};
  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const content = fs.readFileSync(filePath, "base64");
    fileContents[file] = content;
  });
  return fileContents;
};

// Catch all other requests
app.use((req, res) => {
  res.status(404).send("Route not found");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
