"""Export app icons from the user-supplied Brummie Icon.png. Requires Pillow."""
from pathlib import Path
import base64
import re
from PIL import Image, ImageChops

root = Path(__file__).resolve().parent.parent
source = Image.open(root / 'Brummie Icon.png').convert('RGBA')
res = root / 'android/app/src/main/res'
(root / 'build').mkdir(exist_ok=True)
source.resize((512, 512), Image.Resampling.LANCZOS).save(root / 'src/assets/icon.png')
source.save(root / 'build/icon.ico', format='ICO', sizes=[(n,n) for n in [16,24,32,48,64,128,256]])
for density, size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
    folder = res / f'mipmap-{density}'
    folder.mkdir(exist_ok=True)
    source.resize((size,size), Image.Resampling.LANCZOS).save(folder / 'ic_launcher.png')
source.resize((512,512), Image.Resampling.LANCZOS).save(res / 'drawable/brummie_icon.png')
foreground = Image.new('RGBA',(432,432))
foreground.alpha_composite(source.resize((264,264), Image.Resampling.LANCZOS),(84,84))
foreground.save(res / 'drawable/ic_launcher_foreground.png')
mask = ImageChops.multiply(source.convert('L'), source.getchannel('A'))
monochrome = Image.new('RGBA',source.size,'white')
monochrome.putalpha(mask)
foreground = Image.new('RGBA',(432,432))
foreground.alpha_composite(monochrome.resize((264,264), Image.Resampling.LANCZOS),(84,84))
foreground.save(res / 'drawable/ic_launcher_monochrome.png')
index = root / 'index.html'
data = 'data:image/png;base64,' + base64.b64encode((root / 'src/assets/icon.png').read_bytes()).decode()
html = index.read_text()
html = re.sub(r'(<link rel="(?:icon|apple-touch-icon)"[^>]*href=")[^"]+("[^>]*>)',lambda match:match[1]+data+match[2],html)
index.write_text(html)
print('Windows ICO, app PNG, Android density/adaptive/monochrome assets and embedded favicon exported.')
