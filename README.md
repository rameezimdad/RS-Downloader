# RS Downloader: Free Video Downloader and Download Manager for Windows (IDM Alternative)

**RS Downloader** is a free Windows desktop app that downloads videos, MP3 audio, pictures and files from YouTube, Instagram, TikTok, X (Twitter), Facebook, Pinterest, Reddit, Vimeo and 1,800+ other websites. It works like a classic download manager (similar to IDM): paste a link or click **Download this video** in your browser, pick the quality, and the file is saved to your PC. It is made by Rameez Scripts.

**[Download RS Downloader for Windows (latest)](https://github.com/rameezimdad/RS-Downloader-Releases/releases/latest)** | **[Download the browser extension](https://github.com/rameezimdad/RS-Downloader-Releases/releases/latest/download/RS-Downloader-Extension.zip)**

## Key facts

| | |
|---|---|
| Name | RS Downloader |
| Type | Video downloader, MP3 converter and download manager |
| Platform | Windows 10 and Windows 11 (64-bit) |
| Price | Free, no ads |
| Developer | Mohammad Rameez Imdad (Rameez Scripts) |
| Websites | YouTube, Instagram, TikTok, X / Twitter, Facebook, Pinterest, Reddit, Vimeo, Threads, Twitch, SoundCloud, Dailymotion and 1,800+ more |
| Video quality | Every quality the site offers, up to 4K (2160p) and 8K |
| Audio | MP3 320 kbps, MP3 128 kbps, M4A, WAV |
| Browsers | Chrome, Edge, Brave, Opera, Vivaldi (extension) |
| Engines | yt-dlp, gallery-dl, aria2, ffmpeg, Deno (all included in the installer) |
| Updates | Automatic, from this repository |

## Features

- **Paste and download**: paste a link, choose the quality in the Download File Info window, click Start Download.
- **Quality picker on the video**: the browser extension adds a **Download this video** bar to videos with a list of qualities and sizes (1080p, 720p, MP3 and more).
- **YouTube to MP3**: MP3 320, MP3 128, M4A or WAV, with the title and cover picture saved inside the file.
- **Playlists and channels**: download a whole YouTube playlist into its own numbered folder.
- **Pictures**: posts with no video (Pinterest, X, Reddit, Instagram) save their pictures.
- **Files**: zip, rar, exe, msi, apk, pdf, iso and other files download with up to 16 connections at once for speed.
- **Catches browser downloads**: files you download in the browser go to RS Downloader automatically.
- **Download window**: progress bar with size, time left, transfer rate, time taken and total time, plus Pause and Resume.
- **Queue and Batch**: add 50 or 100 links at once; downloads run one after another (1 to 3 at a time).
- **Scheduler**: start the queue every day at a set time (for example at night).
- **Speed limit** and a steady speed reading.
- **Categories**: Video, Music, Pictures, Documents, Compressed, Programs and Other, each with its own folder.
- **Copy or Move to USB or phone**: every finished download shows Copy and Move buttons for each connected USB drive, memory card, external disk or Android phone. Checks free space and warns when a FAT32 USB cannot hold a file over 4 GB.
- **Subtitles** (.srt), **only a part** of a video (start and end time), **MP4 or MKV**.
- **Clipboard watch**, Windows notifications, tray mode and **launch on Windows startup**.
- **Dark mode**.

## How to download a YouTube video on Windows

1. Install RS Downloader and open it.
2. Copy the YouTube video link.
3. Paste it in the link box at the top and press Enter (or press Ctrl+V anywhere in the app).
4. In **Download File Info**, pick the quality (for example 1080p, 4K or MP3), check the Save As folder, and click **Start Download**.
5. The download window shows the progress. When it finishes, click **Open** or **Open folder**.

## How to download a video from your browser

1. Install the browser extension (steps below).
2. Move the mouse over any video. A **Download this video** bar appears at its top right.
3. Click it and pick a quality from the list. Download File Info opens; click **Start Download**.

## Install the browser extension

1. Download **[RS-Downloader-Extension.zip](https://github.com/rameezimdad/RS-Downloader-Releases/releases/latest/download/RS-Downloader-Extension.zip)** and unzip it.
2. Open `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and select the `RS-Downloader-Extension` folder.

RS Downloader can do this for you too: **Options > Browser > Install** opens the right page and folder. The app must be running; the extension talks only to the app on your own PC.

## How to copy a downloaded movie to a USB or phone

1. Plug in the USB, memory card or phone (on the phone, unlock it and choose **File transfer**).
2. In the downloads list, the **Actions** column shows the drive letter (for example **E:**) with Copy and Move.
3. Click **Copy** to keep the PC file, or **Move** to remove it from the PC after copying. To send many files, select them and click **Send to USB**.

## RS Downloader vs IDM

| | RS Downloader | Internet Download Manager (IDM) |
|---|---|---|
| Price | Free | Paid (trial available) |
| YouTube downloads | Yes, with quality list and MP3 | Limited in its Chrome Web Store extension |
| Instagram, TikTok, X, Pinterest | Yes | Partly |
| Pictures from posts | Yes | No |
| Multi-connection file downloads | Yes, up to 16 | Yes |
| Browser extension | Chrome, Edge, Brave, Opera, Vivaldi | Chrome, Edge, Firefox, Opera |
| Queue, scheduler, speed limit | Yes | Yes |
| Copy or move to USB or phone | Yes, from the list | No |
| Platform | Windows | Windows |

## Frequently asked questions

### Is RS Downloader free?
Yes. RS Downloader is free to download and use, with no ads.

### Does RS Downloader work on Windows 11 and Windows 10?
Yes. It runs on 64-bit Windows 10 and Windows 11.

### How do I download YouTube videos in 4K or 1080p?
Paste the YouTube link in RS Downloader, pick 2160p (4K) or 1080p in Download File Info, and click Start Download. The video and sound are joined into one MP4 file.

### How do I convert a YouTube video to MP3?
Paste the link and choose **MP3 320** or **MP3 128** under Audio only. The MP3 keeps the title and cover picture.

### Can it download Instagram Reels, TikTok and X (Twitter) videos?
Yes. Public Reels, posts, TikTok videos and X videos download the same way: paste the link or use the Download this video bar.

### Can it download a whole YouTube playlist?
Yes. Paste the playlist link, turn on **Whole playlist**, pick a quality, and every video is saved into one numbered folder.

### Is RS Downloader an alternative to IDM?
Yes. It has the main download manager features (browser extension, quality list on videos, catching browser downloads, multi-connection files, queue, scheduler, pause and resume) and it is free.

### Do I need to log in to any website?
No. RS Downloader downloads public videos and pictures only. Private or age-restricted videos cannot be downloaded.

### Do I need to install yt-dlp or ffmpeg separately?
No. All engines (yt-dlp, gallery-dl, aria2, ffmpeg, Deno) are inside the installer and update from the app.

### Why does Windows say "Unknown publisher"?
The installer is not code-signed yet. Click **More info**, then **Run anyway**.

### How does RS Downloader update?
It checks this repository at start and every hour, downloads a new version in the background, and installs it when you restart the app.

### Can I copy downloaded movies to a USB drive or Android phone?
Yes. The Actions column shows Copy and Move for every connected USB drive, memory card, external disk or phone.

### Which websites are supported?
YouTube, Instagram, TikTok, X / Twitter, Facebook, Pinterest, Reddit, Vimeo, Threads, Twitch, SoundCloud, Dailymotion and the 1,800+ sites supported by yt-dlp, plus direct file links.

## Source code

The full source code of the app is in this repository.

| Folder | What it holds |
|---|---|
| `src/` | The Electron app: `main.js` (engines, queue, downloads, updates), `preload.js` and the screens in `ui/` |
| `extension/` | The browser extension |
| `tools/` | Build and release scripts |

Run it from source on Windows (Node.js needed):

```
npm install
npm start
```

Build the installer with `npm run dist`. Run `bash tools/fetch-engines.sh` first so the engines are in `engines/`.

## Contact

- WhatsApp: https://wa.me/923435347417
- Email: Contact@rameezscripts.com
- Website: https://rameezscripts.com

Download only videos you own or have permission to save, and follow each website's terms.

Developed by Mohammad Rameez Imdad (Rameez Scripts)