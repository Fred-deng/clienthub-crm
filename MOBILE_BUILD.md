# 移动端打包指南（iOS / Android）

本项目已接入 **Capacitor**，可将 Web 应用打包为原生 iOS / Android App 上架应用商店。

## 一、独立移动端路由

- PC 端访问：`/`、`/customers`、`/sales` … （沿用原有界面）
- 移动端独立路由：`/m`、`/m/customers`、`/m/sales` …
- 手机访问根路径会自动跳转到 `/m`，UI、交互、组件**完全独立**于 PC 端。
- 已覆盖全部 11 个模块（含增/删/改/查/筛选/日期范围/对账登记收付款）。

## 二、首次打包步骤

> Capacitor 项目无法在 Lovable 沙箱中执行原生构建。请按以下流程在你自己的电脑上操作。

### 1. 导出代码到你自己的 GitHub
点击 Lovable 右上角 **Github → Connect to Github**，然后 Pull 到本地。

### 2. 安装依赖
```bash
npm install
```

### 3. 添加原生平台
```bash
npx cap add ios       # 仅 macOS + Xcode 可执行
npx cap add android   # 需安装 Android Studio
```

### 4. 构建并同步
```bash
npm run build
npx cap sync
```

> 之后每次 `git pull` 拉取最新代码后，都需重新执行 `npm run build && npx cap sync`。

### 5. 真机 / 模拟器运行
```bash
npx cap run ios       # 启动 iOS 模拟器或真机
npx cap run android   # 启动 Android 模拟器或真机
```

或：
- iOS: `npx cap open ios`，在 Xcode 中按 ▶ 运行
- Android: `npx cap open android`，在 Android Studio 中运行

## 三、上架流程

### iOS App Store
1. 注册 **Apple Developer Program**（$99/年）
2. 在 Xcode 中配置：
   - Bundle Identifier（已设为 `app.lovable.6be86a77bdcf43f5a7880ca03fec20bd`，建议改为你自己的）
   - Signing & Capabilities → Team
   - App Icon（1024×1024）
3. **Product → Archive** 打包，再通过 Organizer 上传至 **App Store Connect**
4. 在 App Store Connect 填写商店截图、隐私政策、应用描述，提交审核

### Google Play
1. 注册 **Google Play 开发者账号**（$25 一次性）
2. 在 Android Studio：
   - 修改 `android/app/build.gradle` 中的 `applicationId` / `versionCode` / `versionName`
   - 配置签名密钥（**Build → Generate Signed Bundle / APK**）
3. 生成 **AAB (Android App Bundle)**
4. 上传至 [Google Play Console](https://play.google.com/console)，填写商店信息后提交

## 四、生产模式（断开热更新）

当前 `capacitor.config.ts` 中的 `server.url` 指向 Lovable 沙箱（用于开发热更新）。
**正式上架前必须删除该字段**，让 App 加载本地打包的 `dist`：

```ts
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: "app.lovable.6be86a77bdcf43f5a7880ca03fec20bd",
  appName: "集马科技",
  webDir: "dist",
  // 删除整个 server 段
};
```

## 五、常用原生能力（可按需扩展）

```bash
npm install @capacitor/camera        # 相机
npm install @capacitor/push-notifications  # 推送
npm install @capacitor/geolocation   # 定位
npm install @capacitor/filesystem    # 文件读写
```

接入后均需 `npx cap sync` 同步到原生工程。

## 六、参考

- Capacitor 官方文档：https://capacitorjs.com/docs
- Lovable 移动开发指南：https://lovable.dev/blogs/TODO
