import archiver from 'archiver';
import qiniuModule from 'qiniu';
import globby from 'globby';
import path from 'path';
import fs from 'fs-extra';

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
				console.error(err, info);
				reject();
			} else {
				if (ret.hash) console.log('七牛上传成功：KEY=' + dest + ',HASH=' + ret.hash);
				if (ret.error) console.log('七牛上传失败：KEY=' + dest + ',Error=' + ret.error);
				resolve();
			}
		});
	});
}
function qiniuUpload(token, dest, file) {
	return new Promise((resolve, reject) => {
		Uploader.putFile(token, dest, file, null, (err, ret, info) => {
			if (err) {
				console.error(err, info);
				reject(err);
			} else {
				resolve(ret);
			}
		});
	});
}
function zipTarget(paths, callback, dir = '') {
	return new Promise((reslove, reject) => {
		let tmpPath = path.resolve(__dirname, '..', 'tmp');
		fs.emptyDirSync(tmpPath);
		let zipfile = archiver('zip', { zlib: { store: true } });
		let zipPath = path.resolve(tmpPath, Date.now() + '.zip');
		let output = fs.createWriteStream(zipPath);
		output.on('close', () => {
			reslove(zipPath);
		});
		output.on('error', err => {
			reject(err);
		});
		paths.forEach(src => zipfile.file(dir + src, { name: src }));
		callback && callback(zipfile);
		zipfile.pipe(output);
		zipfile.finalize();
	});
}

export default function qiniu(options = {}) {
	let { token, targets, hook = 'buildEnd', debug = true } = options;
	if (typeof token == 'function') token = token(getToken);

	return {
		name: 'qiniu',

		[hook]() {
			let promises = targets.map(({ root, src, dest, zip }) => {
				return globby(src, { cwd: root || process.cwd() }).then(paths => {
					if (zip) {
						return zipTarget(paths, typeof zip == 'function' ? zip : null, root || '').then(file => {
							return qiniuUpload(token, dest, file).then(ret => {
								if (debug && ret.hash) console.log('七牛上传成功：KEY=' + dest + ',HASH=' + ret.hash);
								if (debug && ret.error) console.log('七牛上传失败：KEY=' + dest + ',Error=' + ret.error);
								return fs.remove(file);
							});
						});
					} else {
						return Promise.all(paths.map(file => qiniuUpload(token, dest + file, path.resolve(file))));
					}
				});
			});
			return Promise.all(promises);
		},
	};
}
