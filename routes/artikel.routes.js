const express = require("express");
const { body, validationResult } = require("express-validator");
const { Artikel } = require("../models"); // Pastikan impor model artikelModels sudah benar
const jwt = require("jsonwebtoken");
const router = express.Router();
const multer = require('multer');
const path = require('path');


router.post("/add_artikel", async (req, res) => {
    try {
        const artikel = req.body;

        const newArtikel = await Artikel.create({
            title: artikel.title,
            desc: artikel.desc,
            content: artikel.content,
            cover: artikel.cover,
            category: artikel.category,
            read_time: artikel.read_time,
            source: artikel.source
        });
    
        res.status(201).json({ 
            status: "success",
            message: 'Artikel berhasil di post',
            data: newArtikel
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Gagal memposting artikel' 
        });
    }
});

// Setup multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'covers/'); // Set the destination folder for uploaded cover images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Set a unique filename
    }
});

const upload = multer({ storage: storage });

router.post("/upload_cover", upload.single('cover'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'File not found'
            });
        }

        const coverUrl = req.file.path; // Assuming 'cover' is the field name in the form
        res.status(201).json({
            status: "success",
            message: 'Cover berhasil diupload',
            data: {
                coverUrl: coverUrl,
                coverPath: req.file.path
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Gagal mengupload cover'
        });
    }
});

router.get("/all_artikel", async (req, res) => {
    
    try {
        const allArtikel = await Artikel.findAll({
            attributes: { exclude: ['date_time_created', 'updatedAt'] } // Menyembunyikan kolom date_time_created dan updatedAt
        });

        res.status(200).json({
            status: "success",
            message: "Semua artikel berhasil diambil",
            data: allArtikel
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Gagal mengambil data artikel' 
        });
    }
});

router.get("/category", async (req, res) => {
    
    try {
        const { category } = req.query; // Mengambil kategori dari parameter query

        // Periksa apakah kategori telah diberikan
        if (!category) {
            return res.status(400).json({
                status: "error",
                message: "Kategori harus diberikan sebagai parameter query"
            });
        }

        // Ambil semua artikel berdasarkan kategori
        const allArtikel = await Artikel.findAll({
            where: {
                category: category
            },
            attributes: { exclude: ['date_time_created', 'updatedAt'] }
        });

        res.status(200).json({
            status: "success",
            message: `Artikel dalam kategori '${category}' berhasil diambil`,
            data: allArtikel
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Gagal mengambil data artikel' 
        });
    }
});

router.post("/upload_cover", upload.single('cover'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'File not found'
            });
        }

        const coverUrl = req.file.path; // Assuming 'cover' is the field name in the form
        res.status(201).json({
            status: "success",
            message: 'Cover berhasil diupload',
            data: {
                coverUrl: coverUrl,
                coverPath: req.file.path
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Gagal mengupload cover'
        });
    }
});

router.post("/update", async (req, res) => {
    try {
        const { id, title, desc, content, cover, category, read_time, source } = req.body;

        // Pastikan semua field yang diperlukan ada
        if (!id || !title || !desc || !content || !cover || !category || !read_time || !source) {
            return res.status(400).json({
                message: 'Semua field diperlukan'
            });
        }

        // Cari dan update artikel berdasarkan ID
        const updatedArtikel = await Artikel.update({
            title: title,
            desc: desc,
            content: content,
            cover: cover,
            category: category,
            read_time: read_time,
            source: source,
        }, {
            where: {
                id: id
            }
        });

        // Periksa apakah artikel ditemukan dan diupdate
        if (updatedArtikel[0] === 0) {
            return res.status(404).json({
                message: 'Artikel not found'
            });
        }

        // Ambil data artikel setelah diupdate
        const updatedArtikelData = await Artikel.findByPk(id, {
            attributes: { exclude: ['date_time_created', 'updatedAt'] }
        });

        res.status(200).json({
            status: "success",
            message: 'Artikel berhasil diupdate',
            data: updatedArtikelData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Gagal mengupdate artikel'
        });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const artikelId = req.params.id;

        // Cari dan hapus artikel berdasarkan ID
        const deletedArtikelCount = await Artikel.destroy({
            where: {
                id: artikelId
            }
        });

        // Periksa apakah artikel ditemukan dan dihapus
        if (deletedArtikelCount === 0) {
            return res.status(404).json({
                message: 'Artikel not found'
            });
        }

        res.status(200).json({
            status: "success",
            message: 'Artikel berhasil dihapus'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Gagal menghapus artikel'
        });
    }
});


module.exports = router;
