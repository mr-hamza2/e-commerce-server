import multer from 'multer'

const multerUpload = multer({
    limits: {
        fileSize: 1024 * 1024 * 5
    },
})

const singleUpload = multerUpload.single('photo');

// const attachmentMulter = multerUpload.array("files" , 5);

export { singleUpload };