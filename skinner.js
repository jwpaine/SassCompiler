const config = require('./config')
const fs = require('fs')
var Client = require('ssh2').Client;
var chokidar = require('chokidar');
var sass = require('node-sass');

let enable_upload = true

let upload = function(host, port, username, key, local, remote) {

	console.log(`pretend: ${local} -> ${remote}`)

	return;
	var conn = new Client();
	conn.on('ready', function() {
	  console.log('Client :: ready');
	  conn.sftp(function(err, sftp) {
	    if (err) throw err;
		fs.readFile(local, 'utf8', function(err, contents) {
			if(err) throw err
			sftp.writeFile(remote, contents, function(err) {
				if (err) throw err
				console.log('transferred')
			});
		});
	  });
	}).connect({
	  host: host,
	  port: port,
	  username: username,
	  privateKey: require('fs').readFileSync(key)
	});
}

let compile = function(scss_file, css_file, callback) {
	console.log('Compiling')
	console.log(`input: ${scss_file}`)
	console.log(`output: ${css_file}`)
	sass.render({
	  file: scss_file,
	  outFile: css_file,
	  sourceMap: true,
  	  sourceMapEmbed: true,
	  sourceMapContents: true
	}, function(error, result) { // node-style callback from v3.0.0 onwards
	    if(!error){
	      // No errors during the compilation, write this result on the disk
	      fs.writeFile(css_file, result.css, function(err){
	      	callback(err)
	      });
	      return
	    }
	    callback(error)
	  });
}

let directory = process.argv[2]
let src_directory = directory + 'css/'

let file_map = {
	'v1.scss' : 'v1.css',
	'v2.scss' : 'v2.css'
}

if (fs.existsSync(directory)) {
	// load site specific config
	let c8config = require(directory + '/.c8config')
	console.log(`loaded config: ${JSON.stringify(c8config)}`)
	console.log(`watching ${directory + 'css/src/'} for changes...`)
	let watcher = chokidar.watch(directory + 'css/src/', {
	  persistent: true
	});
	watcher
  		.on('change', path => {
  			//for each key-value pair in file_map, compile...
<<<<<<< HEAD
  			console.log(`changed: ${path}`)
				// upload changed file
				upload(c8config.host, c8config.port, config.sftp.username, config.sftp.privateKey, path, c8config.base_dir + path.split(directory + 'css/')[1])
=======
  			console.log(`src directory: ${src_directory}`)
  			console.log(`local change: ${path.split(src_directory)[1]}`)
  			let file_change = path.split(src_directory)[1];
  			// transfer compiled files
>>>>>>> 7a4e9cf304b1fefc2b6101b79a4e4e654f835c27
  			for(input in file_map) {
  				let output = file_map[input]
  				compile(directory + 'css/src/' + input, directory + 'css/' + output, function(err) {
  				if (err) throw err;

  					let local = directory + 'css/' + output
  					let remote = c8config.base_dir + output;

  					if(enable_upload) {
						upload(c8config.host, c8config.port, config.sftp.username, config.sftp.privateKey, local, remote)
						return
  					}

  					console.log('upload disabled: ')
  					console.log(`${local} --> ${remote}`)
  				})
  			}
  				// move modified file in the src directory
  				if(enable_upload) {
					upload(c8config.host, c8config.port, config.sftp.username, config.sftp.privateKey, path, c8config.base_dir + file_change)
					return
  				}
  				console.log('upload disabled: ')
  				console.log(`${path} --> ${c8config.base_dir + file_change}`)
  		})

} else {
	console.log('Supply directory')
}
