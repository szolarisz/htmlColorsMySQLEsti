const http = require('http');
const mysql = require("mysql");
const fs = require('fs');
const port = 5555;

const conn = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    database: 'colors',
    user: 'root',
    password: ''
});



const server = http.createServer((req, res) => {
    /*
    console.log("Új kérés érkezett:");
    console.log(req.url);
    console.log(req.method);
*/
    //router
    switch (true) {

        case req.url === "/" && req.method === "GET":
            fs.readFile("./views/index.html", (err, file) => {
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(200);
                res.end(file);
            })
            break;

        case req.url === "/script.js" && req.method === "GET":
            fs.readFile("./public/script.js", (err, script) => {
                res.setHeader('Content-Type', 'application/javascript');
                res.writeHead(200);
                res.end(script);
            })
            break;

        case req.url === "/favicon.ico" && req.method === "GET":
            fs.readFile("./views/favicon.ico", (err, icon) => {
                res.setHeader("Content-Type", "image/ico")
                res.writeHead(200);
                res.end(icon);
            })
            break;

        case req.url === "/colors" && req.method === "GET":

            const mySelect = `SELECT * FROM szineim;`;
            conn.connect((err) => {
                if (err) throw err;
                conn.query(mySelect, (err, result, fields) => {
                    if (err) throw err;
                    
                    const szinekJson = JSON.stringify(result);
                    res.setHeader("Content-Type", "application/json");
                    res.writeHead(200);
                    //console.log(szinekJson);
                    conn.end();
                    res.end( szinekJson );
                });
                
                
            });
            
            break;

        case req.url === '/lista' && req.method === "GET":
            let listaHTML = '<ul>';
            fs.readFile('./datas/colors.json', (err, data) => {
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(200);

                const szinek = JSON.parse(data);

                for (elem of szinek) {
                    listaHTML += `<li>${elem.code} ${elem.name}</li>`;
                }
                listaHTML += '</ul>';
                res.end(listaHTML);
            })
            break;

        case req.url === '/colors' && req.method === 'POST':
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });

            req.on('end', () => {
                const newColor = JSON.parse(body);

                /*
                !!!
                sanitaze
                validate
                */
                //Sanitize
                newColor.code = sanitize(newColor.code);
                newColor.name = sanitize(newColor.name);

                //Validate

                //console.log(newColor);
                if (!validateCode(newColor.code)) {
                    //res.setHeader('Content-Type', 'text/html');
                    //res.writeHead(404);
                    //res.end("Hiba van!");
                    return;
                }


                const myInsert = `INSERT INTO szineim VALUES ("${newColor.code}", "${newColor.name}");`;
                console.log(myInsert);
                conn.connect((err) => {
                    if (err) throw err;
                    conn.query(myInsert, (err) => {
                        if (err) throw err;
                    });
                    conn.end();
                });
            });

            break;

        default:
            fs.readFile("./views/error.html", (err, file) => {
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(404);
                res.end(file);
            })

    }
});

server.listen(port);

function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match) => (map[match]));
}

function validateCode(code) {
    if (code.length != 7)
        return false;
    //regex bonyolultabb code: '#[a-fA-F0-9]{6}'
    return true;
}