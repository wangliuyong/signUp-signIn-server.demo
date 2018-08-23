var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号如:\nnode server.js 8888')
  process.exit(1)
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log('HTTP 路径为\n' + path)
  if (path === '/') {
    let string = fs.readFileSync('./index.html', 'utf8');
    let value = fs.readFileSync('./data', 'utf8')
    string = string.replace('$number', value)
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.write(string);
    response.end()
  } else if (path === '/sign_up.html') {//注册
    let string = fs.readFileSync('./sign_up.html', 'utf8');
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.write(string);
    response.end()
  } else if (path === '/sign_up' && method === 'POST') {

    readBody(request).
      then((body)=>{
      let hash = {};
      let user = body.split('&');
      user.forEach((key) => {
        let name = key.split('=')[0];
        let value = key.split('=')[1];
        hash[name] = decodeURIComponent(value);
      });

      let { email, password, password_confirm } = hash;

      if (email.indexOf('@') == '-1') {
        response.statusCode = 400;
        response.setHeader('Content-Type', 'application/json;charset=utf-8');
        response.write('{"email":"error"}');
      } else {
        if (password !== password_confirm) {
          response.statusCode = 400;

          response.write('passwordDiffrent');
        } else {
          var users = fs.readFileSync('./data', 'utf8')
          try {
            users = JSON.parse(users) // []
          } catch (exception) {
            users = []
          }
          let inUse = false
          for (let i = 0; i < users.length; i++) {
            let user = users[i]
            if (user.email === email) {
              inUse = true
              break;
            }
          }
          if (inUse) {
            response.statusCode = 400
            response.write('email in use')
          } else {
            users.push({ email: email, password: password })
            var usersString = JSON.stringify(users)
            fs.writeFileSync('./data', usersString)
            response.statusCode = 200
          }
        }
        response.end();
      }
    });
  } else if (path == '/sign_in.html') {//登录
    let string = fs.readFileSync('./sign_in.html', 'utf8');
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.write(string);
    response.end()
  } else if (path === 'sign_in' && method === 'GET') {
    readBody(request).
      then((body)=>{
        let strings = body.split('&') // ['email=1', 'password=2', 'password_confirmation=3']
      let hash = {}
      strings.forEach((string)=>{
        // string == 'email=1'
        let parts = string.split('=') // ['email', '1']
        let key = parts[0]
        let value = parts[1]
        hash[key] = decodeURIComponent(value) // hash['email'] = '1'
      })
      let {email, password, password_confirmation} = hash
      if(email.indexOf('@') === -1){
        response.statusCode = 400
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.write(`{
          "errors": {
            "email": "invalid"
          }
        }`)
      }else if(password !== password_confirmation){
        response.statusCode = 400
        response.write('password not match')
      }else{
        var users = fs.readFileSync('./data', 'utf8')
        try{
          users = JSON.parse(users) // []
        }catch(exception){
          users = []
        }
        let inUse = false
        for(let i=0; i<users.length; i++){
          let user = users[i]
          if(user.email === email){
            inUse = true
            break;
          }
        }
        if(inUse){
          response.statusCode = 400
          response.write('email in use')
        }else{
          users.push({email: email, password: password})
          var usersString = JSON.stringify(users)
          fs.writeFileSync('./data', usersString)
          response.statusCode = 200
        }
      }
      response.end()
    })
  }else if(path==='/sign_in' && method === 'GET'){
    let string = fs.readFileSync('./sign_in.html', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  }else if(path==='/sign_in' && method === 'POST'){
    readBody(request).then((body)=>{
      let strings = body.split('&') // ['email=1', 'password=2', 'password_confirmation=3']
      let hash = {}
      strings.forEach((string)=>{
        // string == 'email=1'
        let parts = string.split('=') // ['email', '1']
        let key = parts[0]
        let value = parts[1]
        hash[key] = decodeURIComponent(value) // hash['email'] = '1'
      })
      let {email, password} = hash
      var users = fs.readFileSync('./data', 'utf8')
      try{
        users = JSON.parse(users) // []
      }catch(exception){
        users = []
      }
      let found
      for(let i=0;i<users.length; i++){
        if(users[i].email === email && users[i].password === password){
          found = true
          break
        }
      }
      if(found){
        response.setHeader('Set-Cookie', `sign_in_email=${email}`)
        response.statusCode = 200
      }else{
        response.statusCode = 401
      }
      response.end()
      });
  } else {
    response.statusCode = 404
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(`{
      'error':'not found'
    }`)
    response.end()
  }

  /******** 代码结束，下面不要看 ************/
})

function readBody(request){
  return new Promise((resolve,reject)=>{
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      // at this point, `body` has the entire request body stored in it as a string
      resolve(body);
    });
  })
}

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用浏览器打开 http://localhost:' + port)
