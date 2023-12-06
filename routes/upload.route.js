const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('node:path');
const fs = require('fs').promises; // Import module fs untuk operasi file async
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/'); // Direktori tempat menyimpan file
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nama file yang disimpan
  },
});

const upload = multer({ storage: storage });

// Route untuk menghapus gambar
router.delete('/delete/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('images', filename);

    // Periksa apakah file ada sebelum dihapus
    await fs.access(filePath);

    // Hapus file
    await fs.unlink(filePath);

    res.send('File berhasil dihapus!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan saat menghapus file.');
  }
});

// Route untuk upload single image

// Route untuk upload single image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const uploadedFile = req.file;
    if (!uploadedFile) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
    }

    const filePath = path.join('images', uploadedFile.filename);
    const fileUrl = req.protocol + '://' + req.get('host') + '/' + filePath;

    res.status(200).json({
      message: 'File berhasil diunggah!',
      filePath: fileUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengunggah file.' });
  }
});

module.exports = router;
