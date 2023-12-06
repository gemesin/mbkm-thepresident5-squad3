const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const { protect } = require('../middlewares/middleware');
const { ForumModel , commentModel } = require('../models');
const erorHandlerMiddleware = require('../middlewares/error-handling');
const multer = require('multer');
const path = require('node:path');
const { uptime } = require('node:process');
const forumModel = require('../models/forum.model');
const fs = require('fs').promises;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/'); // Direktori tempat menyimpan file
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nama file yang disimpan
  },
});

const upload = multer({ storage: storage });

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.post('/posting', protect, upload.single('image'), async (req, res) => {
  try {
    const loggedInUser = req.user;
    const forum = req.body.isi;
    const uploadedFile = req.file;

    if (!uploadedFile) {
      const forumbaru = await ForumModel.create({
        id_user: loggedInUser.id,
        name: loggedInUser.fullName || 'Default Name', // Change this to a default name if fullName is not available
        captions: forum,
        image: null,
      });

      return res.status(201).json({
        error: false,
        message: "Tambah forum berhasil",
        Ulasan: {
          id_user: forumbaru.id_user,
          name: forumbaru.name,
          isi: forumbaru.captions,
          image: forumbaru.image,
        },
      });
    }

    const filePath = path.join('images', uploadedFile.filename);
    const fileUrl = req.protocol + '://' + req.get('host') + '/' + filePath;

    const forumbaru = await ForumModel.create({
      id_user: loggedInUser.id,
      name: loggedInUser.fullName || 'Default Name', // Change this to a default name if fullName is not available
      captions: forum,
      image: fileUrl,
    });

    return res.status(201).json({
      error: false,
      message: "Tambah forum berhasil",
      Ulasan: {
        id_user: forumbaru.id_user,
        name: forumbaru.name,
        isi: forumbaru.captions,
        image: forumbaru.image,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      error: true,
      message: 'Terjadi kesalahan saat mengunggah file atau menambah forum.',
    });
  }
});


router.get('/allforum', protect, async (req, res) => {
  try {
    
    const allForum = await ForumModel.findAll();

    const forumDenganKomentar = await Promise.all(allForum.map(async (forum) => {
      const jumlahKomentar = await commentModel.count({ where:{id_forum: forum.id }});
      return {
        forumId: forum.id,
        judul: forum.judul,
        isi: forum.isi,
        image: forum.image,
        jumlahKomentar: jumlahKomentar,
      };
    }));

    res.json(forumDenganKomentar);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      error: true,
       message: 'Terjadi kesalahan saat mengambil data forum.' });
  }
});

router.get('/forum/:id', protect, async (req, res) => {
  try {
    const forumId = req.params.id;

    const forum = await ForumModel.findByPk(forumId);

    if (!forum) {
      return res.status(400).json({
        error: true,
        message: 'Forum tidak ditemukan.',
      });
    }

    const komentars = await commentModel.findAll({
      where: { id_forum: forumId },
    });

    const response = {
      forum: {
        id_user: forum.id_user,
        name: forum.name,
        captions: forum.captions, // Menambahkan captions ke respons
        image: forum.image,
      },
      komentars: komentars.map(komentar => ({
        id_user: komentar.id_user,
        name: komentar.name,
        isi: komentar.comment,
        image: komentar.image,
      })),
    };

    res.status(201).json(response);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      error: true,
      message: 'Terjadi kesalahan saat mengambil data forum.',
    });
  }
});


router.post('/balasan/:id_forum', protect, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const idForum = req.params.id_forum;
    const { isi } = req.body;
    const forum = await ForumModel.findByPk(idForum);

    if (!forum) {
      return res.status(404).json({
        error: true,
        message: 'Forum tidak ditemukan.',
      });
    } 

    const komentarBaru = await commentModel.create({
      id_user: loggedInUser.id,
      id_target: forum.id_user, // Menggunakan ID forum sebagai ID target
      name: loggedInUser.fullName || 'Default Name',
      id_forum: idForum,
      comment: isi,
    });

    return res.status(201).json({
      error: false,
      message: 'Balasan berhasil ditambahkan',
      Balasan: {
        id_user: komentarBaru.id_user,
        name: komentarBaru.name,
        isi: komentarBaru.comment,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: true,
      message: 'Terjadi kesalahan saat menambahkan balasan.',
      details: error.message
    });
  }
});

router.put('/edit/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const loggedInUser = req.user;
    const forumId = req.params.id;
    const { isi, captions } = req.body; // Ambil isi dan captions dari form data

    const forum = await ForumModel.findByPk(forumId);

    if (!forum) {
      return res.status(404).json({
        error: true,
        message: 'Forum tidak ditemukan.',
      });
    }

    // Memeriksa apakah pengguna memiliki izin untuk mengedit forum
    if (forum.id_user !== loggedInUser.id) {
      return res.status(403).json({
        error: true,
        message: 'Anda tidak memiliki izin untuk mengedit forum ini.',
      });
    }

    let imagePath = forum.image; // Menyimpan path gambar yang sudah ada

    // Jika ada file gambar yang diunggah, gunakan yang baru
    if (req.file) {
      imagePath = 'http://localhost:8003/' + req.file.path.replace(/\\/g, '/'); // Mengubah path menjadi URL lengkap
    }

    // Melakukan pembaruan forum
    await forum.update({ isi, captions, image: imagePath }); // Memperbarui isi, captions, dan gambar

    // Mengambil forum setelah diperbarui dari database
    const updatedForum = await ForumModel.findByPk(forumId);

    return res.status(200).json({
      error: false,
      message: 'Forum berhasil diperbarui.',
      Forum: {
        id_user: updatedForum.id_user,
        name: updatedForum.name,
        isi: updatedForum.isi,
        image: updatedForum.image.replace('images\\', 'images/'), // Mengubah format path image
        captions: updatedForum.captions, // Menampilkan captions yang baru
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: true,
      message: 'Terjadi kesalahan saat memperbarui forum.',
      details: error.message,
    });
  }
});

// Delete forum by ID
router.delete('/hapus/:id', protect, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const forumId = req.params.id;

    const forum = await ForumModel.findByPk(forumId);

    if (!forum) {
      return res.status(404).json({
        error: true,
        message: 'Forum tidak ditemukan.',
      });
    }

    // Memeriksa apakah pengguna memiliki izin untuk menghapus forum
    if (forum.id_user !== loggedInUser.id) {
      return res.status(403).json({
        error: true,
        message: 'Anda tidak memiliki izin untuk menghapus forum ini.',
      });
    }

    // Menghapus forum
    await forum.destroy();

    return res.status(200).json({
      error: false,
      message: 'Forum berhasil dihapus.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: true,
      message: 'Terjadi kesalahan saat menghapus forum.',
      details: error.message,
    });
  }
});


router.use(erorHandlerMiddleware);

module.exports = router;