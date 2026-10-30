# VELNEST 视频复现 Prompt

说明：现有成片并非通过一条文生视频提示词生成。它由真实 OBS 录屏、
浏览器截图、已有 HyperFrames 片头、Windows Zira 英文合成旁白和 FFmpeg
剪辑脚本制作。下面是根据实际制作过程整理的可复现任务提示词。

## 可复制 Prompt

为 VELNEST 制作一条英文黑客松演示视频。项目根目录为
`D:\Velnest - Twitch`，全部输出保存到 D 盘。

使用真实项目素材，不重新生成产品 UI，不伪造 Twitch 播放器、观看人数、
测试结果或 Codex 聊天。视觉延续现有电竞夜间休息室：深色背景、紫青霓虹、
简单 Q 版人形角色和可替换道具。先展示实际产品，再解释功能和制作方式。

输出 103 秒、1280×720、30 fps、H.264/AAC MP4。使用现有九段英文旁白
`downloads/final-demo/audio/01-intro.wav` 至 `09-end.wav`，旁白文字见
`docs/DEMO-NARRATION.md`。这是 Windows Zira 本地合成语音。
不要克隆真人声音，不添加未经许可的音乐。音量清楚且不削波。

按以下时间线剪辑，片段内保持原始演示速度：

1. 0–9 秒：从 `art/motion/velnest-room/renders/velnest-room.mp4`
   取前 9 秒。标题 VELNEST；明确标注 Authored opening，不能称为直播实录。
2. 9–19 秒：使用 `downloads/final-demo/twitch-live-player.png`，
   展示真实 Twitch 播放器。标题 Running on Twitch。
3. 19–30 秒：使用 `downloads/final-demo/twitch-identity.png`，
   展示已登录身份和入场选择。标题 Your Twitch identity, in the room。
4. 30–42 秒：从 `downloads/recordings/2026-10-29 19-09-01.mp4`
   的 105 秒起取 12 秒，展示 Arc 入场及 lightstick。
5. 42–54 秒：从同一录屏的 18 秒起取 12 秒，展示人物反应动作。
   标题 Wave. Cheer. Dance.；不要声称有多个真实观众参与。
6. 54–65 秒：从同一录屏的 125 秒起取 11 秒，展示人物走向椅子并坐下。
   标题 Make yourself at home。
7. 65–77 秒：使用 `downloads/final-demo/blender-source.png`，
   配合英文旁白说明 Codex 协助制作 React/Three.js 界面、实时服务器、
   Blender 脚本、人物绑定和动画。这是实际源码截图，不是 Codex 聊天录像。
8. 77–92 秒：使用 `downloads/final-demo/qa-success.png`，
   展示实际 Windows/Linux 检查通过。说明 12 组 QA 和可编辑源文件。
9. 92–103 秒：从同一录屏的 155 秒起取 11 秒，返回房间画面。
   标题 Meet you in the nest.；显示 github.com/MarZss03/velnest-twitch。

标题使用简洁白色无衬线字体，辅文使用浅青色，放在不会遮挡关键操作的位置。
实际脚本使用 Arial、32 px 标题和 21 px 辅文。保留真实画面比例。
所有输出片段统一 BT.709 色彩元数据，再拼接，避免切换时解码参数变化。

先检查完整解码、总时长、分辨率、帧率和音频，再逐段抽帧检查。
明确区分片头、真实直播录屏、真实播放器截图和模拟人物美术素材。
不得把第二个真实观众、实体手机测试或直播管理测试写成已验证。
制作本地文件即可；公开上传、直播和最终参赛提交须遵守已确认的授权范围。

## 实际复现入口

在项目根目录运行 `node scripts/assemble-demo.mjs`。
需要 FFmpeg、现有本地素材和旁白文件。精确输入、截取起点和时间线见
`downloads/final-demo/edit-manifest.json`。
最终输出为 `downloads/final-demo/VELNEST-demo.mp4`。
