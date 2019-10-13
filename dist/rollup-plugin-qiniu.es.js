import archiver from 'archiver';
import qiniuModule from 'qiniu';
import globby from 'globby';
import path from 'path';

var config = new qiniuModule.conf.Config();
var Uploader = new qiniuModule.resume_up.ResumeUploader(config);

function getToken(key, secret, bucket) {
	let mac = new qiniuModule.auth.digest.Mac(key, secret);
	let token = new qiniuModule.rs.PutPolicy({ scope: bucket, expires: 300, insertOnly: 1 }).uploadToken(mac);
	return token;
}
function qiniuStream(token, dest, stream) {
	return new Promise((resolve, reject) => {
		Uploader.putStream(token, dest, stream, stream.pointer(), null, (err, ret, info) => {
			if (err) {
				console.log(err, info);
				reject(err);
			} else {
				if (ret.hash) console.log('七牛上传成功：KEY=' + dest + ',HASH=' + ret.hash);
				if (ret.error) console.log('七牛上传失败：KEY=' + dest + ',Error=' + ret.error);
				resolve(ret);
			}
		});
	});
}
function qiniuUpload(token, dest, file) {
	return new Promise((resolve, reject) => {
		Uploader.putFile(token, dest, file, null, (err, ret, info) => {
			if (err) {
				console.log(err, info);
				reject(err);
			} else {
				if (ret.hash) console.log('七牛上传成功：KEY=' + dest + ',HASH=' + ret.hash);
				if (ret.error) console.log('七牛上传失败：KEY=' + dest + ',Error=' + ret.error);
				resolve(ret);
			}
		});
	});
}
function zipTarget(paths) {
	let zipfile = archiver('zip', { zlib: { store: true } });
	// var output = fs.createWriteStream(__dirname + '/example.zip');
	paths.forEach(src => zipfile.file(src));
	// zipfile.pipe(output);
	if (!zipfile.close) {
		zipfile.close = function() {
			zipfile.destroy();
		};
	}
	return zipfile.finalize().then(() => zipfile);
}

function qiniu(options = {}) {
	let { token, targets, hook = 'buildEnd' } = options;
	if (typeof token == 'function') token = token(getToken);

	return {
		name: 'qiniu',

		[hook]() {
			let promises = targets.map(({ src, dest, zip }) => {
				return globby(src).then(paths => {
					if (zip) {
						return zipTarget(paths).then(stream => qiniuStream(token, dest + zip, stream));
					} else {
						return Promise.all(paths.map(file => qiniuUpload(token, dest + file, path.resolve(file))));
					}
				});
			});
			return Promise.all(promises);
		},
	};
}

export default qiniu;
