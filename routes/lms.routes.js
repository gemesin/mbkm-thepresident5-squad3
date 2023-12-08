const express = require("express");
const { body, validationResult } = require("express-validator");
const { Modul } = require("../models"); // Pastikan impor model artikelModels sudah benar
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/add_modul", async (req, res) => {
    try {
        const modul = req.body;

        const newModul = await Modul.create({
            judul: modul.judul,
            desc: modul.desc,
            tanggal: modul.tanggal,
            status: modul.status,
            learning_time: modul.learning_time,
            total_materi: modul.total_materi,
            listing_materi : modul.listing_materi,
            covers: modul.covers
        });
    
        res.status(201).json({ 
            status: "success",
            message: 'Modul berhasil di post',
            data: newModul
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Gagal memposting modul' 
        });
    }
});

router.get("/all_modul", async (req, res) => {
    
    try {
        const allModul = await Modul.findAll({
        });

        res.status(200).json({
            status: "success",
            message: "Semua modul berhasil diambil",
            data: allModul
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Gagal mengambil data modul' 
        });
    }
});

router.get("/all_listing_materi", async (req, res) => {
    
    try {
        const allModul = await Modul.findAll({
            attributes: { exclude: ['tanggal', 'status'] }
        });

        res.status(200).json({
            status: "success",
            message: "Semua listing materi berhasil diambil",
            data: allModul
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Gagal mengambil data listing materi' 
        });
    }
});

router.get("/modul_status", async (req, res) => {
    try {
        const { status } = req.query; 

        if (!status) {
            return res.status(400).json({
                status: "error",
                message: "Status harus diberikan sebagai parameter query"
            });
        }

        // Ambil semua modul berdasarkan status
        const allModul = await Modul.findAll({
            where: {
                status: status
            },
            attributes: { exclude: ['listing_materi'] }
        });

        res.status(200).json({
            status: "success",
            message: `Modul dalam status '${status}' berhasil diambil`,
            data: allModul
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Gagal mengambil data modul' 
        });
    }
});

router.get("/modul/:id", async (req, res) => {
    try {
        // Ambil semua modul berdasarkan id
        const allModul = await Modul.findAll({
            where: {
                id: req.params.id
            },
        });

        res.status(200).json({
            status: "success",
            message: `Modul dengan id '${req.params.id}' berhasil diambil`,
            data: allModul
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Gagal mengambil data modul' 
        });
    }
});


router.post("/update", async (req, res) => {
    try {
        const { id, judul, tanggal, status, learning_time, total_materi, listing_materi, desc, covers } = req.body;

        // Pastikan semua field yang diperlukan ada
        if (!id || !judul || !desc || !tanggal || !status || !learning_time || !total_materi || !listing_materi || !covers) {
            return res.status(400).json({
                message: 'Semua field diperlukan'
            });
        }

        // Cari dan update artikel berdasarkan ID
        const updatedModul = await Modul.update({
            judul: judul,
            desc: desc,
            tanggal: tanggal,
            status: status,
            learning_time: learning_time,
            total_materi: total_materi,
            listing_materi: listing_materi,
            covers: covers
        }, {
            where: {
                id: id
            }
        });

        // Periksa apakah artikel ditemukan dan diupdate
        if (updatedModul[0] === 0) {
            return res.status(404).json({
                message: 'Modul not found'
            });
        }

        // Ambil data artikel setelah diupdate
        const updatedModulData = await Modul.findByPk(id, {
        });

        res.status(200).json({
            status: "success",
            message: 'Artikel berhasil diupdate',
            data: updatedModulData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Gagal mengupdate artikel'
        });
    }
});

router.delete("/delete_modul/:id", async (req, res) => {
    try {
        const modulId = req.params.id;

        // Cari dan hapus modul berdasarkan ID
        const deletedModulCount = await Modul.destroy({
            where: {
                id: modulId
            }
        });

        // Periksa apakah modul ditemukan dan dihapus
        if (deletedModulCount === 0) {
            return res.status(404).json({
                message: 'Modul not found'
            });
        }

        res.status(200).json({
            status: "success",
            message: 'Modul berhasil dihapus'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Gagal menghapus modul'
        });
    }
});

module.exports = router;
