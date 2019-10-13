# rollup-plugin-qiniu
[![](https://img.shields.io/npm/v/rollup-plugin-replace.svg?style=flat)](https://www.npmjs.com/package/rollup-plugin-replace-ast)

打包时将静态资源上传到七牛


## 安装

```bash
npm install --save-dev rollup-plugin-qiniu
```


## 用法


```javascript
// rollup.config.js
import qiniu from 'rollup-plugin-qiniu';

const qiniuKey = 'xxx'
const qiniuSecret = 'xxx'
const qiniuBucket = 'xxx'
export default {
  // ...
  plugins: [
    qiniu({
      token: buildToken => buildToken(qiniuKey, qiniuSecret, qiniuBucket),
      targets: [
        { src: 'resource/remote/**', dest: 'prefix/', zip: 'remote.zip' },
        { src: 'resource/remote/**', dest: 'prefix/', zip: false },
      ],
    }),
  ]
};
```


## 配置

```javascript
{
	/* 七牛上传的token字符串 */
	// 直接字符串形式
	token: '七牛上传的token',
	// 动态生成形式
	token: buildToken => buildToken(qiniuKey, qiniuSecret, qiniuBucket),

	/* 上传内容配置数组 */
	targets: [
		{
			src: 'resource/remote/**', //上传源文件(glob匹配)
			dest: 'prefix/', //上传目标地址前缀
			zip: 'remote.zip',  //是否压缩后上传：false逐文字上传，string压缩后文件名
		},
	],
};
```


## 例子

```javascript
qiniu({
  token: 'xxxxxx',
  targets: [
    { src: 'resource/remote/**.jpg', dest: 'prefix/zip/', zip: 'remote.zip' },
    { src: 'resource/remote/**.png', dest: 'prefix/files/', zip: false },
  ],
}),
```

目录:

```
.
+-- resource
|   +-- remote
|       +-- dir1
|           +-- 1.png
|           +-- 2.jpg
|       +-- dir2
|           +-- 1.jpg
|           +-- 2.png

```

结果:
```
压缩resource/remote/dir1/2.jpg到remote.zip包的resource/remote/dir1/2.jpg下
压缩resource/remote/dir2/1.jpg到remote.zip包的resource/remote/dir2/1.jpg下
从remote.zip上传到{七牛url}/prefix/zip/remote.zip

从resource/remote/dir1/1.png上传到{七牛url}/prefix/files/resource/remote/dir1/1.png
从resource/remote/dir2/2.png上传到{七牛url}/prefix/files/resource/remote/dir2/2.png
```


## License

MIT