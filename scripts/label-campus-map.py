"""Bake static labels into the TDTU map using original flat-map hotspots."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
original = ROOT / 'scripts' / 'source' / 'tdtu-campus-map-original.jpg'
if not original.exists():
    original.parent.mkdir(parents=True, exist_ok=True)
    original.write_bytes((ASSETS / 'tdtu-campus-map.jpg').read_bytes())
image = Image.open(original).convert('RGB')
points = json.loads((ASSETS / 'tdtu-campus-points.json').read_text())
scale = image.width / 1500
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', round(13 * scale))
bold = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', round(12 * scale))
draw = ImageDraw.Draw(image)
occupied = []
anchors = [(p['x'], p['y']) for p in points]
layouts = []
for index, point in enumerate(points, 1):
    x, y = point['x'], point['y']
    text = point['label']
    box = draw.textbbox((0, 0), text, font=font)
    width = (box[2]-box[0]) / scale + 22
    height = 28
    candidates = [(x-width/2, y-48), (x-width/2, y+20), (x+24, y-height/2), (x-width-24, y-height/2),
                  (x-width/2, y-77), (x-width/2, y+49), (x+50, y-48), (x-width-50,y+20)]
    def score(pos):
        left, top = pos
        rect = (left-5, top-5, left+width+5, top+height+5)
        overlaps = sum(not (rect[2] < r[0] or rect[0] > r[2] or rect[3] < r[1] or rect[1] > r[3]) for r in occupied)
        collisions = sum(rect[0]-12 < ax < rect[2]+12 and rect[1]-12 < ay < rect[3]+12 for ax,ay in anchors)
        outside = left < 5 or top < 5 or left+width > 1495 or top+height > image.height/scale-5
        return 10000*outside + 1000*overlaps + 400*collisions + abs(top+height/2-y)+abs(left+width/2-x)
    left, top = min(candidates, key=score)
    occupied.append((left-5,top-5,left+width+5,top+height+5))
    layouts.append((index,point,left,top,width,height))
# Draw connectors first so labels always stay legible.
for index,point,left,top,width,height in layouts:
    x,y = point['x'],point['y']
    end_x = min(max(x,left+6),left+width-6)
    end_y = min(max(y,top+6),top+height-6)
    draw.line([(round(x*scale),round(y*scale)),(round(end_x*scale),round(end_y*scale))],fill='#b89c62',width=round(3*scale))
for index,point,left,top,width,height in layouts:
    x,y = point['x']*scale,point['y']*scale
    rect = tuple(round(v*scale) for v in (left,top,left+width,top+height))
    draw.rounded_rectangle(rect,radius=round(5*scale),fill='#fffdf7',outline='#263f35',width=round(1.2*scale))
    draw.text(((left+width/2)*scale,(top+height/2)*scale),point['label'],font=font,fill='#263f35',anchor='mm')
    radius = 12*scale
    draw.ellipse((x-radius,y-radius,x+radius,y+radius),fill='#263f35',outline='#fffdf7',width=round(2*scale))
    draw.text((x,y),str(index),font=bold,fill='#fffdf7',anchor='mm')
image.save(ASSETS/'tdtu-campus-map.jpg',quality=92,optimize=True,progressive=True)
image.thumbnail((1500,1500),Image.Resampling.LANCZOS)
image.save(ASSETS/'tdtu-campus-map-preview.webp',quality=90)
print('Static map labels generated:',len(points))
