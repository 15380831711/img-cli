#!/usr/bin/env node

const fs = require("fs");

const program = require("commander");

const inquirer = require("inquirer");

const sharp = require("sharp");

const PNG = "png";

const version = "1.0.3";

/**
 * copy图片
 * @param {*} splashLogoSrc
 * @param {*} newPicPath
 */
const copyImg = function(splashLogoSrc, newPicPath) {
    fs.readFile(splashLogoSrc, (err, originBuffer) => {
        if (err) {
            console.log("文件读取失败：" + splashLogoSrc);
            return;
        }
        fs.writeFile(newPicPath, originBuffer, error => {
            if (error) {
                console.log("文件写入失败：" + newPicPath);
                return;
            }
        });
    });
};

/**
 * 获取文件扩展名
 * @param {*} filename
 */
const getFileSuffix = function(filename) {
    let index = filename.lastIndexOf(".");
    let suffix = filename.substring(index + 1);
    return suffix;
};

/**
 * buffer 转 指定尺寸 图片文件
 */
const resizeToFileImg = function(inputBuffer, path, width, height) {
    if (fs.existsSync(path)) {
        console.error("文件已存在：" + path);
        return;
    }
    sharp(inputBuffer)
        .resize(width, height)
        .toFile(path, (err, info) => {
            err && console.error(err);
            if (fs.existsSync(path)) {
                console.log("文件已生成，请检查裁剪出的新图清晰度和完整性：" + path);
            } else {
                console.log("文件未生成：" + path);
            }
        });
};

/**
 * 图片文件转buffer
 */
const fileImgToBuffer = function(imgSrc, callback) {
    if (!fs.existsSync(imgSrc)) {
        console.error("文件不存在：" + imgSrc);
        return;
    }
    sharp(imgSrc)
        .toBuffer()
        .then(data => {
            callback && callback(data);
        })
        .catch(err => {
            console.error(err);
        });
};

let outHelpInfo = function() {
    console.log("");
    console.log("Example:");
    console.log("");
    console.log("   单张图片变换尺寸：");
    console.log("");
    console.log("   img-cli resize");
    console.log("   或");
    console.log("   img-cli resize d:/1024.png d:/yilabao/resize.png 512 512");
    console.log("");
    console.log("   生成打包尺寸图片（注意logo图路径在前）：");
    console.log("");
    console.log("   img-cli xpack d:/logo.png d:/LaunchImage.png d:/yilabao/");
    console.log("");
    console.log("   查看版本帮助信息：");
    console.log("   img-cli -v");
    console.log("   img-cli -h");
    console.log("");
};

//img-cli命令，没加任何参数时，打印帮助信息
if (process.argv.length == 2) {
    outHelpInfo();
    return;
}

program.on("--help", () => {
    outHelpInfo();
});

program.version(version, "-v, --version");

program
    .command("resize [srcImg] [outPath] [width] [height]")
    .alias("re")
    .action((srcImg, outPath, width, height) => {
        if (!(srcImg && outPath && width && height)) {
            //如果命令中参数不完整，则询问输入各个参数
            inquirer
                .prompt([
                    {
                        name: "srcImg",
                        message: "请输入源图片路径："
                    },
                    {
                        name: "outPath",
                        message: "请输入新图片文件输出路径："
                    },
                    {
                        name: "width",
                        message: "请输入新图片宽度："
                    },
                    {
                        name: "height",
                        message: "请输入新图片高度："
                    }
                ])
                .then(answers => {
                    if (!(answers.srcImg && answers.outPath && answers.width && answers.height)) {
                        console.log("输入的命令参数有误！");
                        return;
                    }
                    fileImgToBuffer(answers.srcImg, inputBuffer => {
                        resizeToFileImg(
                            inputBuffer,
                            answers.outPath,
                            parseInt(answers.width),
                            parseInt(answers.height)
                        );
                    });
                });
        } else {
            fileImgToBuffer(srcImg, inputBuffer => {
                resizeToFileImg(inputBuffer, outPath, parseInt(width), parseInt(height));
            });
        }
    });

//新建一个xpack命令，用于生成夏恒内部xpack打包图片！
program
    .command("xpack <srcLogoImage> <srcLaunchImage> <outDir>")
    .alias("xp")
    .description("生成新打包图片")
    .action((srcLogoImage, srcLaunchImage, outDir) => {
        if (!(getFileSuffix(srcLogoImage) == PNG && getFileSuffix(srcLaunchImage) == PNG)) {
            console.log("只支持PNG格式图片。");
            return;
        }
        if (outDir && outDir.lastIndexOf("/") != outDir.length - 1 && outDir.lastIndexOf("\\") != outDir.length - 1) {
            outDir += "/";
        }
        //生成安卓苹果打包图片存放目录
        let androidPics = outDir + "android_pics/";
        let iosPics = outDir + "ios_pics/";
        let dirs = [
            outDir,
            iosPics,
            androidPics,
            androidPics + "mipmap-mdpi/",
            androidPics + "mipmap-hdpi/",
            androidPics + "mipmap-xhdpi/",
            androidPics + "mipmap-xxhdpi/",
            androidPics + "mipmap-xxxhdpi/"
        ];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            console.log(dir);
        });

        //生成安卓苹果logo
        if (fs.existsSync(srcLogoImage)) {
            fileImgToBuffer(srcLogoImage, data => {
                let iOSLogoSizes = [40, 57, 58, 60, 80, 87, 120, 180, 512, 1024];
                let androidLogoSizes = [
                    { size: 48, path: "mipmap-mdpi/" },
                    { size: 72, path: "mipmap-hdpi/" },
                    { size: 96, path: "mipmap-xhdpi/" },
                    { size: 144, path: "mipmap-xxhdpi/" },
                    { size: 192, path: "mipmap-xxxhdpi/" }
                ];
                let newPicPath;
                iOSLogoSizes.forEach((size, index) => {
                    newPicPath = iosPics + size + "." + PNG;
                    resizeToFileImg(data, newPicPath, size, size);
                });
                androidLogoSizes.forEach((size, index) => {
                    newPicPath = androidPics + size.path + "icon_logo.png";
                    resizeToFileImg(data, newPicPath, size.size, size.size);
                });
                //生成安卓mipmap-xxhdpi/splash_logo.png  500*150  临时图片
                newPicPath = androidPics + "mipmap-xxhdpi/splash_logo.png";
                // resizeToFileImg(data, newPicPath, 500, 150);
                //拷贝splash_logo.png到安卓图片目录
                let splashLogoSrc = "assets/imgs/splash_logo.png";
                copyImg(splashLogoSrc, newPicPath);
                console.log("启动logo注意重新切图并替换：" + newPicPath);
            });
        } else {
            console.log("源文件不存：" + srcLogoImage);
        }

        if (fs.existsSync(srcLaunchImage)) {
            //生成iOS启动图
            fileImgToBuffer(srcLaunchImage, data => {
                let iOSLaunchImageSizes = [
                    { width: 640, height: 960 },
                    { width: 640, height: 1136 },
                    { width: 750, height: 1334 },
                    { width: 828, height: 1792 },
                    { width: 1125, height: 2436 },
                    { width: 1242, height: 2208 },
                    { width: 1242, height: 2688 }
                ];
                let newPicPath;
                iOSLaunchImageSizes.forEach((size, index) => {
                    newPicPath = iosPics + "LaunchImage" + size.width + "-" + size.height + "." + PNG;
                    resizeToFileImg(data, newPicPath, size.width, size.height);
                });
            });
        } else {
            console.log("源文件不存：" + srcLaunchImage);
        }
    })
    .on("--help", function() {
        console.log("");
        console.log("Examples:");
        console.log(" img-cli xpack d:/logo.png d:/LaunchImage.png d:/yilabao/");
    });

program.parse(process.argv);
