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
const { Likes } = require('../models');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/'); // Directory to store files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Filename to be saved
  },
});

const upload = multer({ storage: storage });

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const uploadMultiple = upload.array('images', 5); // Using the defined 'upload' middleware for multiple file uploads

router.post('/buat_postingan', protect, uploadMultiple, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const forum = req.body.captions;
    const uploadedFiles = req.files;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      // Handling case where no images were uploaded
      return res.status(400).json({
        error: true,
        message: 'No images were uploaded.',
      });
    }

    const fileUrls = [];
    const fileNames = [];
for (const file of uploadedFiles) {
  fileNames.push(file.filename);
}
    const images = [];
for (const file of uploadedFiles) {
  const filePath = '/images/' + file.filename; // Updated path
  fileUrls.push(req.protocol + '://' + req.get('host') + filePath);
  images.push(file);
}

const forumbaru = await ForumModel.create({
  id_user: loggedInUser.id,
  name: loggedInUser.fullName || 'Default Name',
  captions: forum,
  image: fileUrls.join(','), // Simpan nama file sebagai string yang dipisahkan koma
  createdAt: new Date(),
});


    const responseData = {
      error: false,
      message: 'Tambah forum berhasil',
      forum: {
        id_user: forumbaru.id_user,
        name: forumbaru.name,
        captions: forumbaru.captions,
        image: fileUrls,
        createdAt: forumbaru.createdAt.toISOString(),
      },
    };

    return res.status(201).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      error: true,
      message: 'Terjadi kesalahan saat menambah forum.',
    });
  }
});

router.get('/semua_postingan', protect, async (req, res) => {
  try {
    const allForum = await ForumModel.findAll();

    const forumDenganKomentarDanLike = await Promise.all(allForum.map(async (forum) => {
      const jumlahKomentar = await commentModel.count({ where: { id_forum: forum.id } });
      const jumlahLike = await Likes.count({ where:{ id_post: forum.id, liked: true }});
      let images = [];
      if (forum.image) {
        images = forum.image.split(',').map(path => path.replace('image\\', 'image/'));
      }
      const forumData = {
        forumId: forum.id,
        judul: forum.judul,
        isi: forum.isi,
        image: images,
        jumlahKomentar: jumlahKomentar,
        captions: forum.captions,
        createdAt: forum.createdAt.toISOString(),
        id_user: forum.id_user, // Menambahkan ID pengguna
        name_user: forum.name, // Menambahkan nama pengguna
        jumlahLike: jumlahLike,
      };
      return forumData;
    }));

    // Penanganan khusus jika hanya ada satu gambar dalam respon
    forumDenganKomentarDanLike.forEach(forumData => {
      if (forumData.image.length === 1) {
        forumData.image = forumData.image[0]; // Mengubah menjadi string tunggal jika hanya ada satu gambar
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Semua postingan berhasil diambil',
      data: forumDenganKomentarDanLike
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      error: true,
      message: 'Terjadi kesalahan saat mengambil data forum.'
    });
  }
});


   

router.get('/postingan/:id', protect, async (req, res) => {
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

    const likes = await Likes.findAll({
      where: { id_post: forumId, liked: true },
      attributes: ['id_user', 'liked_by'],
    });

    const totalLikes = likes.length;

    const mappedComments = {};
    komentars.forEach((komentar) => {
      const idKomentar = komentar.id;
      if (!mappedComments[idKomentar]) {
        mappedComments[idKomentar] = {
          id_komentar: idKomentar,
          id_user: komentar.id_user,
          name: komentar.name,
          komentar: komentar.comment, // Mengubah 'isi' menjadi 'komentar'
          image: komentar.image,
          createdAt: komentar.createdAt,
          id_parent_comment: komentar.id_parent_comment,
          jumlahKomentar: 0,
        };
      }
      if (komentar.id_parent_comment && mappedComments[komentar.id_parent_comment]) {
        mappedComments[komentar.id_parent_comment].jumlahKomentar += 1;
      }
    });

    const commentsArray = Object.values(mappedComments);

    const response = {
      forum: {
        id_user: forum.id_user,
        name: forum.name,
        captions: forum.captions,
        image: forum.image.split(',').map(path => path.replace('images\\', 'images/')),
      },
      komentars: commentsArray,
      jumlahKomentar: commentsArray.length,
      jumlahLike: totalLikes,
      likes: likes,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      error: true,
      message: 'Terjadi kesalahan saat mengambil data forum.',
    });
  }
});




router.post('/komentar/:id_forum', protect, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const idForum = req.params.id_forum;
    const { komentar } = req.body;

    const forum = await ForumModel.findByPk(idForum);

    if (!forum) {
      return res.status(404).json({
        error: true,
        message: 'Forum tidak ditemukan.',
      });
    } 

    const komentarBaru = await commentModel.create({
      id_user: loggedInUser.id,
      id_target: forum.id_user,
      name: loggedInUser.fullName || 'Default Name',
      id_forum: idForum,
      comment: komentar,
      
    });

    return res.status(201).json({
      error: false,
      message: 'komentar berhasil ditambahkan',
      Balasan: {
        id_komentar: komentarBaru.id,
        id_user: komentarBaru.id_user,
        name: komentarBaru.name,
        komentar: komentarBaru.comment, // Menggunakan nilai dari 'komentar'
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

router.post('/komentar/:id_forum/:id_komentar', protect, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const idForum = req.params.id_forum;
    const idKomentar = req.params.id_komentar; // Menggunakan ID komentar yang ingin dibalas
    const { komentar } = req.body;

    const forum = await ForumModel.findByPk(idForum);

    if (!forum) {
      return res.status(404).json({
        error: true,
        message: 'Forum tidak ditemukan.',
      });
    } 

    const komentarToReply = await commentModel.findByPk(idKomentar); // Temukan komentar yang ingin dibalas

    if (!komentarToReply) {
      return res.status(404).json({
        error: true,
        message: 'Komentar yang ingin dibalas tidak ditemukan.',
      });
    }

    const komentarBaru = await commentModel.create({
      id_user: loggedInUser.id,
      id_target: komentarToReply.id_user, // Gunakan id pemilik komentar yang ingin dibalas
      name: loggedInUser.fullName || 'Default Name',
      id_forum: idForum,
      id_parent_comment: idKomentar, // Simpan referensi ke komentar yang ingin dibalas
      comment: komentar,
    });

    return res.status(201).json({
      error: false,
      message: 'Komentar berhasil ditambahkan sebagai balasan',
      Balasan: {
        id_komentar: komentarBaru.id,
        id_user: komentarBaru.id_user,
        name: komentarBaru.name,
        komentar: komentarBaru.comment,
        id_parent_comment: komentarBaru.id_parent_comment, // Sertakan ID komentar yang dijadikan parent
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: true,
      message: 'Terjadi kesalahan saat menambahkan balasan.',
      details: error.message,
    });
  }
});




router.put('/edit_captions/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const loggedInUser = req.user;
    const forumId = req.params.id;
    const { isi, captions } = req.body;

    const forum = await ForumModel.findByPk(forumId);

    if (!forum) {
      return res.status(404).json({
        error: true,
        message: 'Forum tidak ditemukan.',
      });
    }

    if (forum.id_user !== loggedInUser.id) {
      return res.status(403).json({
        error: true,
        message: 'Anda tidak memiliki izin untuk mengedit forum ini.',
      });
    }

    // Memeriksa jika ada file gambar yang diunggah
    if (req.file) {
      return res.status(400).json({
        error: true,
        message: 'Anda tidak diizinkan mengubah gambar.',
      });
    }

    // Melakukan pembaruan hanya untuk isi dan captions
    await forum.update({ isi, captions });

    // Mengambil forum yang sudah diperbarui dari database
    const updatedForum = await ForumModel.findByPk(forumId);

    return res.status(200).json({
      error: false,
      message: 'Forum berhasil diperbarui.',
      Forum: {
        id_user: updatedForum.id_user,
        name: updatedForum.name,
        isi: updatedForum.isi,
        image: updatedForum.image.split(',').map(path => path.replace('images\\', 'images/')), // Menampilkan kembali informasi gambar yang ada sebelumnya
        captions: updatedForum.captions,
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
router.delete('/hapus_postingan/:id', protect, async (req, res) => {
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


// Route to like a forum post
router.put('/like/:id', protect, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const forumId = req.params.id;

    // Check if the user has already liked the forum
    const existingLike = await Likes.findOne({
      where: {
        id_post: forumId,
        id_user: loggedInUser.id,
        liked: true,
      },
    });

    if (existingLike) {
      return res.status(400).json({
        error: true,
        message: 'Anda sudah menyukai postingan ini sebelumnya.',
      });
    }

    // Create a new like
    const forum = await ForumModel.findByPk(forumId);

    if (!forum) {
      return res.status(404).json({
        error: true,
        message: 'Maaf, postingan tidak ditemukan.',
      });
    }

    const like = await Likes.create({
      id_user: loggedInUser.id,
      id_post: forumId,
      id_target: forum.id_user, // ID dari orang yang menerima like
      liked: true,
      liked_by: loggedInUser.fullName || 'Default Name', // Simpan nama pengguna yang melakukan like
    });

    return res.status(200).json({
      error: false,
      message: 'Anda telah menyukai postingan ini.',
      like,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: true,
      message: 'Terjadi kesalahan saat menambahkan like.',
      details: error.message,
    });
  }
});

// Route to unlike a forum post
router.put('/unlike/:id', protect, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const forumId = req.params.id;
     
    const forum = await ForumModel.findByPk(forumId);

    if (!forum) {
      return res.status(404).json({
        error: true,
        message: 'Maaf, postingan tidak ditemukan.',
      });
    }

    // Find the like by the logged-in user for the specific post
    const like = await Likes.findOne({
      where: {
        id_post: forumId,
        id_user: loggedInUser.id,
        liked: true,
      },
    });

    if (!like) {
      return res.status(400).json({
        error: true,
        message: 'Anda belum menyukai postingan ini.',
      });
    }
 
    // Update the like to 'unliked'
    await like.update({ liked: false });

    return res.status(200).json({
      error: false,
      message: 'Anda sudah berhasil unlike postingan ini.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: true,
      message: 'Terjadi kesalahan saat melakukan unlike.',
      details: error.message,
    });
  }
});


router.use(erorHandlerMiddleware);

module.exports = router;
