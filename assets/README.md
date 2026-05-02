# 应用图标 & 启动页（iOS / Android 上架资源）

本目录是 **Capacitor Assets 工具**的源资源。配合 `@capacitor/assets`
一行命令即可生成所有平台所需的全部尺寸图标 / 启动页。

## 文件清单

| 文件                | 尺寸        | 用途                                   |
| ------------------- | ----------- | -------------------------------------- |
| `icon.png`          | 1024×1024   | App 图标（自动生成所有 iOS/Android 尺寸） |
| `splash.png`        | 2732×2732   | 启动页 - 浅色模式                      |
| `splash-dark.png`   | 2732×2732   | 启动页 - 深色模式（Android 12+ / iOS 自动适配） |

> 所有源图必须保持正方形。Capacitor Assets 会按平台规范裁切到正确比例。

## 一键生成全部平台资源

> 前提：你已经在自己电脑上 `git pull` 了项目，并执行过
> `npm install`、`npx cap add ios`、`npx cap add android`。

```bash
npx capacitor-assets generate
```

执行后会自动生成并写入：

- **iOS**：`ios/App/App/Assets.xcassets/AppIcon.appiconset/*` 全套图标
  + `ios/App/App/Assets.xcassets/Splash.imageset/*` 启动页
- **Android**：`android/app/src/main/res/mipmap-*/ic_launcher*.png`
  + `android/app/src/main/res/drawable*/splash.png`
  + `android/app/src/main/res/values/ic_launcher_background.xml`（自适应图标背景）

之后正常 `npm run build && npx cap sync` 即可。

## 替换为你自己的品牌

直接覆盖本目录的三张 PNG（保持文件名与正方形尺寸不变），然后再次运行：

```bash
npx capacitor-assets generate
```

即可一键替换所有图标和启动页。
