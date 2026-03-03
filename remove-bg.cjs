const path = require('path');
const fs = require('fs');
let Jimp;

try {
    Jimp = require('jimp');
} catch (e) {
    console.error("Jimp not installed yet.");
    process.exit(1);
}

const dir = path.join(__dirname, 'public');

async function processImages() {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

    for (const file of files) {
        if (!file.includes('1772')) continue; // only touch AI generated ones
        const imgPath = path.join(dir, file);
        console.log("Processing", file);

        try {
            const image = await Jimp.read(imgPath);
            const w = image.bitmap.width;
            const h = image.bitmap.height;

            const isCheckerBg = (hex) => {
                const rgba = Jimp.intToRGBA(hex);
                // Checkerboard colors: usually #FFF or #CCC or slightly off due to jpeg artifacts in png
                const minVal = Math.min(rgba.r, rgba.g, rgba.b);
                const maxVal = Math.max(rgba.r, rgba.g, rgba.b);
                const maxDiff = maxVal - minVal;

                // Needs to be grayish and light
                return (rgba.r > 190 && maxDiff < 20 && rgba.a > 0);
            };

            const q = [];
            // We use a typed array for visited to be fast and not crash with OOM
            const visited = new Uint8Array(w * h);
            const getIdx = (x, y) => { return y * w + x; };

            for (let x = 0; x < w; x++) { q.push([x, 0]); q.push([x, h - 1]); }
            for (let y = 0; y < h; y++) { q.push([0, y]); q.push([w - 1, y]); }

            let head = 0;
            while (head < q.length) {
                const [x, y] = q[head++];

                if (x < 0 || x >= w || y < 0 || y >= h) continue;

                const vIdx = getIdx(x, y);
                if (visited[vIdx]) continue;
                visited[vIdx] = 1;

                const hex = image.getPixelColor(x, y);
                if (isCheckerBg(hex)) {
                    image.setPixelColor(0x00000000, x, y);
                    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
                }
            }

            await image.writeAsync(imgPath);
            console.log("Done", file);
        } catch (err) {
            console.error("Failed on", file, err.message);
        }
    }
}

processImages();
