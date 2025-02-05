const express = require('express');
const router = express.Router();
const multer = require('multer');

const uploadDestination = 'uploads'


// показываем, где будем хранить файлы
const storage = multer.diskStorage({
    destination: uploadDestination,
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
});

const uploads = multer({storage: storage})



module.exports = router;