const express=require('express')
const path=require('path')
const app = express()
const multer = require('multer');
const fs = require('fs');
const csv2json = require('csvjson-csv2json/csv2json');
    
var storage = multer.diskStorage(
    {
        destination: './receivedFiles/',
        filename: function ( req, file, cb ) {
            cb( null, file.originalname);
        }
    }
);
var upload = multer({storage: storage});


// view engine setup
app.set('views', path.join(__dirname, 'static', 'views'))
app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'static', 'public')))


var admin = require("firebase-admin");
var serviceAccount = require("./secretKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mindx-app.firebaseio.com"
});


let db=admin.firestore();
let testUsers =db.collection('testUsers');

app.post('/test', upload.single('file'), async (req,res) => {
    var receivedFile = req.file;
    var contents = fs.readFileSync(receivedFile.path).toString();
    var jsonList = csv2json(contents, {parseNumbers: true});
    for(var i =0; i < jsonList.length; i++) {
        jsonList[i]['passwordHash'] = Buffer.from(jsonList[i]['passwordHash']);
        jsonList[i]['passwordSalt'] = Buffer.from(jsonList[i]['passwordSalt']);
    }
    await createUsers(jsonList).then((val) => {
        console.log(val);
        res.send(val);
    });
})

app.get('/', (req, res) => {

    // res.write("Hello\n"); 
    res.write("Hello" + " ".repeat(1024) + "\n"); 

    setTimeout(() => {
        res.write("1");
    }, 1000);

    setTimeout(() => {
        res.write("2");
    }, 1000);

    setTimeout(() => {
        res.write("3");
    }, 1000);

    setTimeout(() => {
        res.write("4");
        res.end()
    }, 1000);

});


async function createUsers(jsonList)  {
    console.log('called');
    admin.auth().importUsers(jsonList, {
        hash: {
            algorithm: 'HMAC_SHA256',
            key: Buffer.from('secretKey')
        }
    }).then((userImportResult) => {
        userImportResult.errors.forEach((indexedError) => {
            // The corresponding user that failed to upload.
            console.log(
              'Error ' + indexedError.index,
              ' failed to import: ',
              indexedError.error
            );
          });
        return userImportResult.successCount;
    }).catch((err) =>{
        console.log(err);
    });
    console.log('done');
}

app.post('/addStudents', async (req,res)=> {



});

var port = process.env.PORT || 8080;
var router = express.Router();

app.use('v1/api', router);
app.listen(port);

console.log('Magic happens on port' + port);