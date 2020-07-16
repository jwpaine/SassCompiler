const config = require('./config')
const fs = require('fs')
var Client = require('ssh2').Client;
var chokidar = require('chokidar');
var sass = require('node-sass');

let enable_upload = true  


 
let upload = function(c8config, local, remote) {

	
	if(!enable_upload) {
		console.log('upload returning early');
		return // early
	}
	var conn = new Client();
	conn.on('ready', function() {
		console.log('connected')  
		// transfer files
		console.log(`uploading: ${local} -> ${remote}`)
		conn.sftp(function(err, sftp) {
		    if (err) throw err;
			fs.readFile(local, 'utf8', function(err, contents) {
				if(err) throw err
				sftp.writeFile(remote, contents, function(err) {
					if (err) throw err
					console.log('transferred')
					// end connection
					conn.end()
				});
			});
		 });
	}).connect({
	  host: c8config.host,
	  port: c8config.port,
	  username: config.sftp.username,
	  privateKey: require('fs').readFileSync(config.sftp.privateKey)
	});

	conn.on('end', function () {
    	console.log('Client :: ended');
    	conn.end();
	})

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
	'v1.scss' : 'v1.css'
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

	  			// return connection
	  		
					console.log('SSH Client :: connected and ready');
				
		  			console.log(`file changed: ${path}`)
					// upload changed file
					console.log(`src directory: ${src_directory}`)
		  			console.log(`local change: ${path.split(src_directory)[1]}`)
		  			
					upload(c8config, path, c8config.base_dir + path.split(directory + 'css/')[1])
					
		  			
		  			let file_change = path.split(src_directory)[1];
		  			// transfer compiled files
		  			for(input in file_map) {
		  				let output = file_map[input]
		  				compile(directory + 'css/src/' + input, directory + 'css/' + output, function(err) {
		  				if (err) throw err;

		  					let local = directory + 'css/' + output
		  					let remote = c8config.base_dir + output;

							upload(c8config, local, remote)
							

		  				})
		  			}
		  				// move modified file in the src directory
		  				
						upload(c8config, path, c8config.base_dir + file_change)
						

						// destroy connection
			


	  		})

	

} else {
	console.log('Supply directory')
}
